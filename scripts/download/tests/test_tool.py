#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
_test_tool
----------------------------------

Tests for `Download.Tool` class.
'''
from os.path import isdir
import unittest


class TestTool(unittest.TestCase):

    #: the location the partial query layers test db
    scratch = 'C:\\Users\\agrc-arcgis\\Documents\\ArcGIS\\scratch'

    def setUp(self):
        from Download import Tool

        #: thing being tested
        self.patient = Tool()

    def tearDown(self):
        self.patient._delete_scratch_data(self.scratch)

    def test_sanity(self):
        self.assertIsNotNone(self.patient)

    def test_create_fgdb(self):
        actual = self.patient._create_fgdb(self.scratch)

        self.assertEqual(isdir(actual), True)

    def test_creat_where_clause(self):
        self.assertEqual('Project_ID in (1,2,3)', self.patient._create_where_clause([1, 2, 3]))

    def test_get_table_from_name(self):
        self.assertEqual('POINT', self.patient._get_table_from_name('POINT').table_name)
