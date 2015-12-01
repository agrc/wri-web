# repoint mxds at local, dev, AT, or prod Database
# requires that you have database connections in
# catalog with the names below
import arcpy
import sys


mxd = 'SummaryReport.mxd'
db = r'Database Connections\\'
local = db + 'WRI_LOCAL.sde'
dev = db + 'WRI_DEV as wri_user.sde'
at = db + 'WRI_AT as wri_user.sde'
prod = db + 'WRI_PROD as wri_read.sde'
target = None

if len(sys.argv) > 1:
    target = sys.argv[1]

if not target:
    target = raw_input('Local (L), Dev (D), AT (A), or Prod (P)? ')

if target == 'D':
    dest = dev
elif target == 'A':
    dest = at
elif target == 'P':
    dest = prod
else:
    dest = local

print('updating {} to use {}'.format(mxd, dest))

mxd = arcpy.mapping.MapDocument(mxd)
l = arcpy.mapping.ListLayers(mxd)[0]
mxd.findAndReplaceWorkspacePaths(l.workspacePath, dest, True)
mxd.save()

print('done')
