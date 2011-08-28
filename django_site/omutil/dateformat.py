import datetime

"""copied from
http://stackoverflow.com/questions/3401428/how-to-get-an-isoformat-datetime-string-including-the-default-timezone
"""

now = datetime.datetime.now()
utc_now = datetime.datetime.utcnow()

delta = now - utc_now
hh, mm = divmod((delta.days * 24 * 60 * 60 + delta.seconds + 30) // 60, 60)

def as_IsoUTC(dt):
    """turn a datetime object into its corresponding iso-UTC string form"""
    return '%s+%02d:%02d' % (dt.isoformat(), hh, mm)

if __name__ == '__main__':
    print as_IsoUTC(now)

