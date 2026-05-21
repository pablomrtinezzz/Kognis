import logging
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.core.config import settings
from src.core.database import db

logger = logging.getLogger(__name__)


async def evaluate_daily_streaks() -> None:
    """
    CRON Job: Evaluates daily goals at midnight.
    If current_value >= target_value, streak increments.
    Else, streak resets to 0.
    Finally, current_value is reset to 0 for the new day.
    """
    logger.info("Starting daily streak evaluation...")
    try:
        # Fetch all active goals
        response = db.table("goals").select("*").execute()
        goals = response.data

        if not goals:
            logger.info("No goals found to evaluate.")
            return

        for goal in goals:
            current_streak = goal.get("streak", 0)

            # Did the user hit the target today?
            if goal["current_value"] >= goal["target_value"]:
                new_streak = current_streak + 1
            else:
                new_streak = 0

            # Upsert the new values to the database
            db.table("goals").update(
                {
                    "streak": new_streak,
                    "current_value": 0,  # Reset for the next day
                }
            ).eq("id", goal["id"]).execute()

        logger.info(f"Successfully evaluated and reset {len(goals)} goals.")

    except Exception as e:
        logger.error(f"Failed to evaluate streaks: {str(e)}")


# Initialize the Async Scheduler anchored to the configured timezone
scheduler = AsyncIOScheduler(timezone=ZoneInfo(settings.TIMEZONE))

# Schedule the job to run every day at midnight in the configured timezone
scheduler.add_job(evaluate_daily_streaks, trigger="cron", hour=0, minute=0)
