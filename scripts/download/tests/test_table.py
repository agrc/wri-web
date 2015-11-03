#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
_test_table
----------------------------------

Tests for `Download.Table` class.
'''
import unittest
from mock import Mock, call


class TestTable(unittest.TestCase):

    def setUp(self):
        from Download import Table

        self.patient = Table('local', None)

    def test_fields(self):
        self.patient._fields = [
            ('FeatureID', 'INT', 'NON_NULLABLE'), ('TypeDescription', 'TEXT', 'NULLABLE', 255),
            ('FeatureSubTypeDescription', 'TEXT', 'NULLABLE', 255), ('ActionDescription', 'TEXT', 'NULLABLE', 255),
            ('Description', 'TEXT', 'NULLABLE', 255), ('Project_ID', 'INT', 'NON_NULLABLE'),
            ('StatusDescription', 'TEXT', 'NULLABLE', 50), ('Shape@', )
        ]

        self.assertEqual(
            ['FeatureID', 'TypeDescription', 'FeatureSubTypeDescription', 'ActionDescription', 'Description',
             'Project_ID', 'StatusDescription', 'Shape@'], self.patient.fields)

    def test_add_field_when_no_need_to_add(self):
        import arcpy
        mock = Mock()
        arcpy.AddField_management = mock

        self.patient._add_field('table', ('Shape@',))

        self.assertEqual(mock.call_count, 0)

    def test_add_field_with_length(self):
        import arcpy
        mock = Mock()
        arcpy.AddField_management = mock

        self.patient._add_field('table', ('name', 'type', 'nullable', 'length'))

        self.assertEqual(mock.call_args_list,
                         [call(in_table='table',
                               field_name='name',
                               field_type='type',
                               field_is_nullable='nullable',
                               field_length='length')])

    def test_add_field_without_length(self):
        import arcpy
        mock = Mock()
        arcpy.AddField_management = mock

        self.patient._add_field('table', ('name', 'type', 'nullable'))

        self.assertEqual(mock.call_args_list,
                         [call(in_table='table',
                               field_name='name',
                               field_type='type',
                               field_is_nullable='nullable')])
