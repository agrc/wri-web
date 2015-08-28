#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
test_zipToGraphics
----------------------------------
test the zipToGraphics module
'''

import unittest
from nose.tools import raises
from os.path import join
from ZipToGraphics import zipToGraphics
import arcpy


class TestZipToGraphics(unittest.TestCase):
    def tearDown(self):
        # clear up temp data
        names = ['copy', 'checkgeometry']
        for n in names:
            arcpy.Delete_management('in_memory/' + n)
        arcpy.Delete_management('{}/project'.format(arcpy.env.scratchGDB))

    @raises(Exception)
    def test_checks_for_prj_file(self):
        zipToGraphics.main(join('tests', 'data', 'Missing_Prj.zip'), 'Terrestrial Treatment Area')

    def test_reproject(self):
        result = zipToGraphics.main(join('tests', 'data', 'UTM.zip'), 'Terrestrial Treatment Area')
        self.assertEqual(arcpy.Describe(result['outFeature']).spatialReference.name,
                         zipToGraphics.wgs.name)
        self.assertEqual(result['messages'], '')

    def test_multiple_features(self):
        result = zipToGraphics.main(join('tests', 'data', 'Multiple_Features.zip'), 'Terrestrial Treatment Area')
        self.assertEqual(result['messages'], zipToGraphics.multiple_warning)
        result_count = int(arcpy.GetCount_management(result['outFeature']).getOutput(0))
        self.assertEqual(result_count, 1)

    def test_multi_point(self):
        result = zipToGraphics.main(join('tests', 'data', 'Multi_Point.zip'), 'Other point feature')
        self.assertEqual(result['messages'], '')
        result_count = int(arcpy.GetCount_management(result['outFeature']).getOutput(0))

    @raises(Exception)
    def test_self_intersecting(self):
        zipToGraphics.main(join('tests', 'data', 'Self_Intersecting.zip'), 'Terrestrial Treatment Area')

    @raises(Exception)
    def test_incorrect_category(self):
        zipToGraphics.main(join('tests', 'data', 'UTM.zip'), 'Guzzler')

    @raises(Exception)
    def test_incorrect_category(self):
        zipToGraphics.main(join('tests', 'data', 'UTM.zip'), 'Bad Category')
