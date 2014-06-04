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

lake_source := ftp://ftp.dnr.state.mn.us/pub/gisftp/hawatson/shapefiles.zip
lake_source_local := data/original/water_dnr_hydrography.zip
lake_shape_root := data/build/water_dnr_hydrography-shp
lake_shape := data/build/water_dnr_hydrography-shp/dnr_hydro_features_all.shp
lake_converted := $(converted_shps_dir)/water_dnr_hydrography.shp
lake_test_converted := $(converted_shps_dir)/water_dnr_hydrography-TEST.shp

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

$(lake_shape): $(lake_source_local)
	mkdir -p data/build
	unzip $(lake_source_local) -d $(lake_shape_root)
	touch $(lake_shape)

unpack: $(bath_shape) $(lake_shape)


# Reproject, filter, convert
$(bath_converted): $(bath_shape)
	mkdir -p $(converted_shps_dir)
	ogr2ogr -f "ESRI Shapefile" $(bath_converted) $(bath_shape) -overwrite -t_srs "EPSG:4326"

$(lake_converted): $(lake_shape)
	mkdir -p $(converted_shps_dir)
	ogr2ogr -f "ESRI Shapefile" $(lake_converted) $(lake_shape) -overwrite -where "WB_CLASS LIKE '%lake%' AND ACRES >= 10" -t_srs "EPSG:4326"

# We need to dissolve the lakes because lakes are split up, mid-water, by
# administrative boundaries, like county or state.
#
# It is more efficient and accurate to dissolve the lakes here and combine the
# properties.
$(lake_test_converted): $(lake_shape)
	mkdir -p $(converted_shps_dir)
	ogr2ogr -f "ESRI Shapefile" $(lake_test_converted) $(lake_shape) -overwrite -dialect SQLite -sql \
	"SELECT SUBSTR(DOWLKNUM, 1, LENGTH(DOWLKNUM) - 2) AS id, GROUP_CONCAT(DOWLKNUM) AS ids, SUM(ACRES) AS a, SUM(SHORE_MI) AS s, GROUP_CONCAT(LAKE_NAME) AS n, GROUP_CONCAT(CTY_NAME) AS c, ST_Union(geometry) as geometry FROM dnr_hydro_features_all WHERE WB_CLASS LIKE '%lake%' AND ACRES < 500 AND ACRES >= 10 AND DOWLKNUM <> '00000000' GROUP BY id" -t_srs "EPSG:4326"

convert: $(bath_converted) $(lake_converted) $(lake_test_converted)
clean_convert:
	rm -rv $(converted_shps_dir)
clean_convert_testing:
	rm -rv $(lake_test_converted)


# Combine and process
$(processed_data): $(lake_converted) $(lake_test_converted)
	node $(processing_script)


# Main
all: $(processed_data)
