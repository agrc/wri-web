#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
build_json
----------------------------------
builds a .json file used to configure the app
'''

from os.path import join
from settings import *
import pyodbc
import json


json_file = join(JSONDIR, 'config.json')
connection = pyodbc.connect(CONNECTION_STRING)
cursor = connection.cursor()


def get_data(table, fields):
    cursor.execute('SELECT {} FROM {}'.format(','.join(fields), table))
    return [list(row) for row in cursor.fetchall()]


def make_lu(table, key, value):
    cursor.execute('SELECT {},{} FROM {}'.format(key, value, table))
    obj = {}
    for row in get_data(table, [key, value]):
        obj[row[0]] = row[1]

    return obj


actions_lu = make_lu('LU_ACTION', 'ActionID', 'ActionDescription')
treatments_lu = make_lu('LU_TREATMENTTYPE', 'TreatmentTypeID', 'TreatmentTypeDescription')
obj = {
    'projectStatus': get_data('LU_STATUS', ['StatusDescription', 'StatusID']),
    'featureType': get_data('LU_FEATURETYPE', ['FeatureTypeDescription', 'FeatureTypeID']),
    'featureAttributes': {}
}

# add actions and treatments to polygon features
cursor.execute("""
SELECT FeatureTypeDescription, FeatureTypeID FROM LU_FEATURETYPE
WHERE FeatureClassAssociation = 'Poly'
""")
for row in cursor.fetchall():
    desc = row[0]
    code = row[1]
    cursor.execute("""
        SELECT ActionID FROM FEATURE_ACTION
        WHERE FeatureTypeID = {}
        """.format(code))
    for row in cursor.fetchall():
        cursor.execute("""
            SELECT TreatmentTypeID FROM ACTION_TREATMENT
            WHERE ActionID = {}
            """.format(row[0]))
        treatments = [treatments_lu[row2[0]] for row2 in cursor.fetchall()]
        try:
            obj['featureAttributes'][desc][actions_lu[row[0]]] = treatments
        except KeyError:
            obj['featureAttributes'][desc] = {actions_lu[row[0]]: treatments}

# get global actions for points and lines
cursor.execute("""
SELECT ActionDescription FROM LU_ACTION
WHERE ActionID IN(
    SELECT ActionID FROM FEATURE_ACTION
    WHERE FeatureTypeID = 5)
""")
obj['pointLineActions'] = [row[0] for row in cursor.fetchall()]

# get subtypes for points and lines
cursor.execute("""
SELECT FeatureTypeDescription, FeatureTypeID FROM LU_FEATURETYPE
WHERE FeatureClassAssociation IN('Point', 'Line')
""")
for row in cursor.fetchall():
    desc = row[0]
    code = row[1]
    cursor.execute("""
        SELECT FeatureSubTypeID FROM FEATURETYPE_FEATURESUBTYPE
        WHERE FeatureTypeID = {}
        """.format(code))
    obj['featureAttributes'][desc] = [actions_lu[row[0]] for row in cursor.fetchall()]

f = open(json_file, 'w')
print >> f, json.dumps(obj, indent=4)
f.close()
