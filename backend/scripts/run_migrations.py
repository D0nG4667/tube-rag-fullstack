import logging
import os
import sys

from alembic import command
from alembic.config import Config

from app.core.config import settings

logger = logging.getLogger("tuberag.migrations")


def run():
    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    if not db_url:
        logger.error("DATABASE_URL is not set.")
        return

    # Programmatic invocation of Alembic upgrade head
    logger.info("Running database migrations via Alembic upgrade head...")
    try:
        config_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "alembic.ini",
        )
        alembic_cfg = Config(config_path)
        alembic_cfg.attributes["configure_logging"] = False
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrations executed successfully.")
    except Exception as e:
        logger.error(f"Migration execution failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    run()
