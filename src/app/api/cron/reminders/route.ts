import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { NoteModel } from '@/models/Note';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const now = new Date();

    const dueNotes = await NoteModel.find({
      reminder: { $ne: null, $lte: now },
      reminderSent: { $ne: true },
      isArchived: false,
      isTrashed: false,
      userId: { $ne: null },
    }).limit(25);

    if (dueNotes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending due reminders found',
        processed: 0,
      });
    }

    const db = mongoose.connection.db;
    const usersColl = db?.collection('user');
    let sentCount = 0;

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      'http://localhost:3000';

    for (const note of dueNotes) {
      try {
        let recipientEmail: string | null = null;
        let recipientName: string | undefined = undefined;

        if (note.userId) {
          const rawUserId = String(note.userId).trim();

          if (rawUserId.includes('@')) {
            recipientEmail = rawUserId;
          } else if (usersColl) {
            const queryConditions: Array<Record<string, unknown>> = [
              { id: rawUserId },
              { _id: rawUserId },
            ];

            if (mongoose.isValidObjectId(rawUserId)) {
              queryConditions.push({ _id: new mongoose.Types.ObjectId(rawUserId) });
            }

            const userDoc = await usersColl.findOne({ $or: queryConditions });
            if (userDoc && userDoc.email) {
              recipientEmail = String(userDoc.email);
              recipientName = userDoc.name ? String(userDoc.name) : undefined;
            }
          }
        }

        if (recipientEmail && resendApiKey) {
          const from = process.env.EMAIL_FROM || 'My Keeps <onboarding@resend.dev>';
          const subject = `🔔 Reminder: ${note.title || 'Untitled Note'}`;

          const formattedTime = new Date(note.reminder as Date).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          });

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from,
              to: recipientEmail,
              subject,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
                  <div style="background: #023859; color: #A7EBF2; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">
                    🔔 Scheduled Reminder
                  </div>
                  <h2 style="color: #011C40; margin: 0 0 12px 0;">${note.title || 'Untitled Note'}</h2>
                  <p style="color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap; background: #f8fafc; padding: 16px; border-left: 4px solid #54ACBF; border-radius: 6px;">${note.content || 'No details'}</p>
                  <p style="font-size: 12px; color: #64748b; margin-top: 16px;">⏰ <strong>Time:</strong> ${formattedTime}</p>
                  <div style="margin-top: 24px;">
                    <a href="${appUrl}/reminders" style="background: #023859; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">Open in My Keeps &rarr;</a>
                  </div>
                </div>
              `,
            }),
          });

          if (res.ok) {
            sentCount++;
          }
        }

        // Mark note as sent to prevent duplicate triggering
        note.reminderSent = true;
        await note.save();
      } catch (noteError) {
        console.error('Error processing note in cron:', noteError);
        note.reminderSent = true;
        await note.save().catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueNotes.length,
      emailsSent: sentCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
