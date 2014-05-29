#
# Make file for Lacu
#

# Variables
converted_shps_dir := data/build/converted-4326-shps

bath_source := ftp://ftp.dnr.state.mn.us/pub/deli/d31302343658330.zip
bath_source_local := data/original/bath_contln3.zip
bath_shape_root := data/build/bath_contln3-shp
bath_shape := data/build/bath_contln3-shp/mndnrdata/state/mn/bath_contln3.shp
bath_converted := $(converted_shps_dir)/bath_contln3.shp

lake_source := ftp://ftp.dnr.state.mn.us/pub/gisftp/hawatson/water_dnr_hydrography.zip
lake_source_local := data/original/water_dnr_hydrography.zip
lake_gdb_root := data/build/water_dnr_hydrography-gdb
lake_gdb := data/build/water_dnr_hydrography-gdb/water_dnr_hydrography/water_dnr_hydrography.gdb
lake_converted := $(converted_shps_dir)/water_dnr_hydrography.shp

processing_script := data-processing/process-lakes.js
processed_data := data/lakes.json


# Download sources
$(bath_source_local):
	mkdir -p data/original
	curl -o $(bath_source_local) "$(bath_source)"

$(lake_source_local):
	mkdir -p data/original
	curl -o $(lake_source_local) "$(lake_source)"

download: $(bath_source_local) $(lake_source_local)


# Unarchive downloads
$(bath_shape): $(bath_source_local)
	mkdir -p data/build
	unzip $(bath_source_local) -d $(bath_shape_root)
	touch $(bath_shape)

$(lake_gdb): $(lake_source_local)
	mkdir -p data/build
	unzip $(lake_source_local) -d $(lake_gdb_root)
	touch $(lake_gdb)

unpack: $(bath_shape) $(lake_gdb)


# Reproject, filter, convert
$(bath_converted): $(bath_shape)
	mkdir -p $(converted_shps_dir)
	ogr2ogr -f "ESRI Shapefile" $(bath_converted) $(bath_shape) -overwrite -t_srs "EPSG:4326"

$(lake_converted): $(lake_gdb)
	mkdir -p $(converted_shps_dir)
	ogr2ogr -f "ESRI Shapefile" $(lake_converted) $(lake_gdb) -overwrite -t_srs "EPSG:4326"

convert: $(bath_converted) $(lake_converted)


# Combine and process
$(processed_data): $(lake_converted)
	node $(processing_script)


# Main
all: $(processed_data)
