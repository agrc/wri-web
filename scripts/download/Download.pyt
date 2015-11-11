import arcpy
import secrets
from os.path import join, exists, isdir, splitext
from os import makedirs, remove, sep, walk
from glob import glob
from itertools import chain
from shutil import rmtree
from zipfile import ZipFile, ZIP_DEFLATED


class Parameter(object):

    def __init__(self, value):
        super(Parameter, self).__init__()
        self.value = value

    @property
    def valueAsText(self):
        return self.value


class Table(object):
    _table_name_to_geometry_type = {'POINT': 'MULTIPOINT', 'LINE': 'POLYLINE', 'POLY': 'POLYGON'}

    def __init__(self, table_name, fields):
        self.table_name = table_name
        self._fields = fields

    @property
    def geometry_type(self):
        return self._table_name_to_geometry_type[self.table_name]

    @property
    def fields(self):
        return [field_name[0] for field_name in self._fields]

    def create_spatial_table(self, location, table, sr):
        arcpy.AddMessage('-- create table ' + table.table_name)
        arcpy.CreateFeatureclass_management(out_path=location,
                                            out_name=table.table_name,
                                            geometry_type=table.geometry_type,
                                            spatial_reference=sr)

    def create_schema(self):
        [self._add_field(self.table_name, field) for field in self._fields]

    def _add_field(self, table, field):
        if len(field) == 1:
            return

        arcpy.AddMessage('-- adding field ' + field[0])

        if len(field) == 4:
            arcpy.AddField_management(in_table=table,
                                      field_name=field[0],
                                      field_type=field[1],
                                      field_is_nullable=field[2],
                                      field_length=field[3])

            return

        arcpy.AddField_management(in_table=table,
                                  field_name=field[0],
                                  field_type=field[1],
                                  field_is_nullable=field[2])


class Toolbox(object):

    def __init__(self):
        self.label = 'wri-download'
        self.alias = 'wri-download'

        # List of tool classes associated with this toolbox
        self.tools = [Tool]


class Tool(object):

    version = '0.1.0'

    def __init__(self):
        self.label = 'Download'
        self.description = 'Download WRI Data ' + self.version
        self.canRunInBackground = True
        self.fgdb = 'WriSpatial.gdb'
        self.sr = arcpy.SpatialReference(3857)
        self.db = self._get_db('local')

        self.tables = [
            Table('POINT', [
                ('FeatureID', 'SHORT', 'NON_NULLABLE'), ('TypeDescription', 'TEXT', 'NULLABLE', 255),
                ('FeatureSubTypeDescription', 'TEXT', 'NULLABLE', 255), ('ActionDescription', 'TEXT', 'NULLABLE', 255),
                ('Description', 'TEXT', 'NULLABLE', 255), ('Project_ID', 'SHORT', 'NON_NULLABLE'),
                ('StatusDescription', 'TEXT', 'NULLABLE', 50), ('Shape@', )
            ]), Table('LINE', [
                ('FeatureID', 'SHORT', 'NON_NULLABLE'), ('TypeDescription', 'TEXT', 'NULLABLE', 255),
                ('FeatureSubTypeDescription', 'TEXT', 'NULLABLE', 255), ('ActionDescription', 'TEXT', 'NULLABLE', 255),
                ('Description', 'TEXT', 'NULLABLE', 255), ('Project_ID', 'SHORT', 'NON_NULLABLE'),
                ('StatusDescription', 'TEXT', 'NULLABLE', 50), ('Shape@', )
            ]), Table('POLY', [
                ('FeatureID', 'SHORT', 'NON_NULLABLE'), ('TypeDescription', 'TEXT', 'NULLABLE', 255),
                ('Project_ID', 'SHORT', 'NON_NULLABLE'), ('StatusDescription', 'TEXT', 'NULLABLE', 50),
                ('Retreatment', 'TEXT', 'NULLABLE', 1), ('Shape@', )
            ])
        ]

    def set_db(self, who):
        self.db = self._get_db(who)

    def getParameterInfo(self):
        '''Returns the parameters required for this tool'''

        p0 = arcpy.Parameter(displayName='project id strings',
                             name='project_ids',
                             datatype='String',
                             parameterType='Required',
                             direction='Input')

        p1 = arcpy.Parameter(displayName='Output zip file',
                             name='output',
                             datatype='File',
                             parameterType='Derived',
                             direction='Output')

        return [p0, p1]

    def isLicensed(self):
        '''Set whether tool is licensed to execute.'''
        return True

    def updateParameters(self, parameters):
        '''Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed.
        '''
        return

    def updateMessages(self, parameters):
        '''Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation.
        '''
        return

    def execute(self, parameters, messages):
        '''Returns the location on the server of a zip file
        :param paramters: the parameters sent to the gp service
        :param message:
        '''
        arcpy.AddMessage('executing version ' + self.version)

        project_ids = [id.strip() for id in parameters[0].valueAsText.split(',')]

        output_location = arcpy.env.scratchFolder
        folder_to_zip = output_location

        # not needed when running on server
        self._delete_scratch_data(output_location)
        self._create_scratch_folder(output_location)

        gdb = self._create_fgdb(output_location)
        records = self._get_rows_for_tables(project_ids)
        self._export_to_fgdb(gdb, records)

        zip_location = join(folder_to_zip, 'SpatialData' + '.zip')
        arcpy.AddMessage('-Zipping the result in ' + folder_to_zip)
        arcpy.AddMessage('-Zipping the result to ' + zip_location)

        self._zip_output_directory(folder_to_zip, zip_location)

        arcpy.SetParameterAsText(1, zip_location)

        return zip_location

    def _get_rows_for_tables(self, project_ids):
        where_clause = self._create_where_clause(project_ids)

        results = {}
        arcpy.env.workspace = self.db['workspace']

        for table in self.tables:
            with arcpy.da.SearchCursor(in_table=self.db['name'] + '.dbo.' + table.table_name,
                                       field_names=table.fields,
                                       where_clause=where_clause) as cursor:
                for row in cursor:
                    results.setdefault(table.table_name, []).append(row)

        return results

    def _export_to_fgdb(self, gdb_path, records):
        arcpy.env.workspace = gdb_path
        for feature_class_name in records.keys():
            table = self._get_table_from_name(feature_class_name)
            table.create_spatial_table(gdb_path, table, self.sr)
            table.create_schema()
            shape_index = -1
            if feature_class_name == 'POINT':
                shape_index = table.fields.index('Shape@')
            with arcpy.da.InsertCursor(in_table=feature_class_name,
                                       field_names=table.fields) as cursor:
                for row in records[feature_class_name]:
                    if shape_index > -1:
                        row = list(row)
                        row[shape_index] = self._convert_point_to_multipoint(row[shape_index])
                    cursor.insertRow(row)

    def _get_db(self, who):
        if who == 'dev':
            return secrets.dev
        if who == 'at':
            return secrets.at
        if who == 'prod':
            return secrets.prod

        return secrets.local

    def _get_table_from_name(self, name):
        return [table for table in self.tables if table.table_name == name][0]

    def _convert_point_to_multipoint(self, point):
        return arcpy.Multipoint(arcpy.Array(point.getPart(0)))

    def _create_where_clause(self, project_ids):
        return 'Project_ID in ({})'.format(','.join([str(id) for id in project_ids]))

    def _create_scratch_folder(self, directory):
        arcpy.AddMessage('--_create_scratch_folder::{}'.format(directory))

        if not exists(directory):
            makedirs(directory)

    def _delete_scratch_data(self, directory, types=None):
        arcpy.AddMessage('--_delete_scratch_data::{}'.format(directory))

        limit = 5000
        i = 0

        if types is None:
            types = ['csv', 'zip', 'xlsx', 'gdb', 'cpg', 'dbf', 'xml', 'prj', 'sbn', 'sbx', 'shx', 'shp']

        items_to_delete = map(lambda x: glob(join(directory, '*.' + x)), types)
        # flatten [[], []]
        items_to_delete = list(chain.from_iterable(items_to_delete))

        def delete(thing):
            if isdir(thing):
                rmtree(thing)
            else:
                remove(thing)

        while len(filter(exists, items_to_delete)) > 0 and i < limit:
            try:
                map(delete, items_to_delete)
            except Exception as e:
                print e
                i += 1

        return True

    def _create_fgdb(self, output_location):
        '''Creates and writes values to a file geodatabse
        :param output_location: the parent folder to the *.gdb
        '''
        arcpy.AddMessage('--create_fgdb::{}'.format(output_location))

        arcpy.CreateFileGDB_management(output_location, self.fgdb)
        output_location = join(output_location, self.fgdb)

        return output_location

    def _zip_output_directory(self, source_location, destination_location):
        '''creates a zip folder based on the `source_location` and `destination_location` parameters.
        :param source_location: the location of the folder to compress
        :param destination_location: the location and name to save the zip file
        '''
        arcpy.AddMessage('--_zip_output_directory::{}'.format(destination_location))

        with ZipFile(destination_location, 'w', ZIP_DEFLATED) as zip_writer:
            for root, dirs, files in walk(source_location):
                if 'scratch.gdb' in root:
                    continue
                for file_name in files:
                    extension = self._get_extension(file_name)
                    if extension in ['.zip', '.lock']:
                        continue

                    full_name = join(root, file_name)
                    name = full_name[len(source_location) + len(sep):]
                    zip_writer.write(full_name, name)

    def _get_extension(self, f):
        '''Returns the file type extension
        :param f: the file to get the extension of
        '''
        file_name, file_extension = splitext(f)

        return file_extension.lower()

    # if __name__ == '__main__':
    #     from Download import Tool
    #     Tool().execute([Parameter('1,2,3')], None)
