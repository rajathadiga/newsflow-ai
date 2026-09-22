from apscheduler.schedulers.background import BackgroundScheduler

from ingest import ingest_all

scheduler = BackgroundScheduler()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(ingest_all, "interval", minutes=15, id="ingest_job", replace_existing=True)
        scheduler.start()
