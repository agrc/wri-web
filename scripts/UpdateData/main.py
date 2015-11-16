import secrets
import arcpy
import time
from agrc import update
from agrc import messaging
from agrc import logging
from os.path import join

local_folder = secrets.LOCAL
databases = ['SGID10', 'UDNR']


class Runner():
    def __init__(self):
        self.start_time = time.time()
        self.logger = logging.Logger()
        self.emailer = messaging.Emailer(secrets.NOTIFICATION_EMAILS,
                                         testing=not secrets.SEND_EMAILS)

    def runWithTryCatch(self):
        try:
            self.run()
            self.logger.logMsg('\nScript was successful!')
        except arcpy.ExecuteError:
            self.logger.logMsg('arcpy.ExecuteError')
            self.logger.logError()
            self.logger.logGPMsg()
            self.emailer.sendEmail(
                self.logger.scriptName + ' - arcpy.ExecuteError',
                self.logger.log)
        except Exception:
            self.logger.logError()
            self.emailer.sendEmail(
                self.logger.scriptName + ' - Python Error',
                self.logger.log)
        finally:
            self.logger.writeLogToFile()

    def run(self):
        for db in databases:
            update.updateFGDBfromSDE(join(local_folder, db + '.gdb'),
                                     join('database_connections', db + '.sde'),
                                     self.logger)

if __name__ == "__main__":
    Runner().runWithTryCatch()
