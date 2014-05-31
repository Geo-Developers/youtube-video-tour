///////////////////////////////////////////////////////////////////////////////
// loadgpx.js
//
// Lectura de fichero gpx,para cargar con el API de ArcGIS
// 
// Fichero de origen loadgpx.4.js
// Copyright (C) 2006 Kaz Okuda (http://notions.okuda.ca)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// If you use this script or have any questions please leave a comment
// at http://notions.okuda.ca/geotagging/projects-im-working-on/gpx-viewer/
// A link to the GPL license can also be found there.
//
// Modificado por Carlos Guerrero López
///////////////////////////////////////////////////////////////////////////////
//
// History:
//    revision 1 - Initial implementation
//    revision 2 - Removed LoadGPXFileIntoGoogleMap and made it the callers
//                 responsibility.  Added more options (colour, width, delta).
//    revision 3 - Waypoint parsing now compatible with Firefox.
//    revision 4 - Upgraded to Google Maps API version 2.  Tried changing the way
//               that the map calculated the way the center and zoom level, but
//               GMAP API 2 requires that you center and zoom the map first.
//               I have left the bounding box calculations commented out in case
//               they might come in handy in the future.
//
//    5/28/2010 - Upgraded to Google Maps API v3 and refactored the file a bit.
//                          (Chris Peplin)
//    116/05/2014 -revision 5: - Eliminadas funciones no usadas
//
// Autor origial: Kaz Okuda original
// URI: http://notions.okuda.ca/geotagging/projects-im-working-on/gpx-viewer/
//
// Autor de la actualización: Carlos Guerrero López
// URI: http://www.carlosguerrerolopez.com
// Actualizado por Carlos Guerrero para que funcione con el API JavaScript de ArcGIS 
// 
//
///////////////////////////////////////////////////////////////////////////////

function GPXParser(xmlDoc, map) {
    this.xmlDoc = xmlDoc;
}

GPXParser.prototype.addTrackSegmentToMap = function(trackSegment, colour,width) {
    require(["esri/geometry/Point",
        "esri/geometry/Polyline",
        "esri/symbols/SimpleLineSymbol",
        "esri/graphic",
        "esri/Color",
        "esri/SpatialReference",
        "esri/symbols/SimpleMarkerSymbol"],
    function(Point,
        Polyline,
        SimpleLineSymbol,
        Graphic,
        Color,
        SpatialReference,
        SimpleMarkerSymbol) {  
            //Comprobamos si el gpx tiene coordenadas
            var trackpoints = trackSegment.getElementsByTagName("trkpt");
            if(trackpoints.length == 0) {
                return;
            }

            //Array donde almacenamos los puntos para despues generar la polyline
            var pointarray = [];
            //Obtenemos la hora de comienzo del video
            var dtComienzo =new Date(trackpoints[0].children[1].textContent);
            //Variable donde almacenamos el tiempo de cada punto
            var horaPunto;
            //Variable que usaremos para saber los segundos que hay entre cada punto
            var auxTiempo=dtComienzo;
            //Guardamos el punto anterior de cada GX.pasada
            var puntoAnterior;


            //Recorremos todos los puntos
            for(var i = 0; i < trackpoints.length; i++) {
                //Obtenemos las coordenadas de los puntos del gpx
                var lon = parseFloat(trackpoints[i].getAttribute("lon"));
                var lat = parseFloat(trackpoints[i].getAttribute("lat"));
                //Creamos un objeto punto con esas coordenadas
                latlng = new Point(lon,lat);
                //Lo agregamos al array para crear la linea a pintar
                pointarray.push(latlng);
                //Obtenemos la hora del punto actual
                var dt2 = new Date(trackpoints[i].children[1].textContent);
                
                //Restamos la hora actual a la anterior
                horas=Math.floor((dt2-auxTiempo)/1000);
                //Almacenamos la hora actual
                auxTiempo=dt2;
                //Agregamos el punto anterior al array de segundos para poder seguir el video
                for(var j = 1; j < horas; j++) {
                    GX.arraySegundos.push(puntoAnterior);
                }
                //Agregamos el punto actual al array
                GX.arraySegundos.push(latlng);
                //Almacenamos el punto actual
                puntoAnterior=latlng;

                //Creamos un objeto punto que no se va a ver para poder pinchar sobre la linea y posicionarnos
                // en ese segundo del video
                var sms = new SimpleMarkerSymbol();
                sms.setColor(new esri.Color([0,0,255,0.0]))
                sms.setOutline(null);
                var segundoEnVideo=Math.floor((dt2-dtComienzo)/1000);
                var graphic = new Graphic(latlng, sms,{hora:segundoEnVideo});
                GX.lgisCapaVerticesGPX.add(graphic);

            }
            // Por ultimo agregamos todos los puntos a la linea y la dibujamos
            var polyline =  new Polyline(new SpatialReference({wkid:4326}));
            polyline.addPath(pointarray);
            var sls = new SimpleLineSymbol();
            sls.setColor(new esri.Color([255,0,0]))
            var graphic = new Graphic(polyline, sls);
            map.graphics.add(graphic);

    });
}

GPXParser.prototype.addTrackToMap = function(track, colour, width) {
       var segments = track.getElementsByTagName("trkseg");
        for(var i = 0; i < segments.length; i++) {
            var segmentlatlngbounds = this.addTrackSegmentToMap(segments[i], colour,
                    width);
        }

}

GPXParser.prototype.centerAndZoom = function(trackSegment) {
    require([
        "esri/map","esri/geometry/Extent"], 
        function(Map,Extent) {
            var pointlist = new Array("trkpt", "wpt");
            var minlat = 0;
            var maxlat = 0;
            var minlon = 0;
            var maxlon = 0;

            for(var pointtype = 0; pointtype < pointlist.length; pointtype++) {

                // Center the map and zoom on the given segment.
                var trackpoints = trackSegment.getElementsByTagName(
                        pointlist[pointtype]);

                // If the min and max are uninitialized then initialize them.
                if((trackpoints.length > 0) && (minlat == maxlat) && (minlat == 0)) {
                    minlat = parseFloat(trackpoints[0].getAttribute("lat"));
                    maxlat = parseFloat(trackpoints[0].getAttribute("lat"));
                    minlon = parseFloat(trackpoints[0].getAttribute("lon"));
                    maxlon = parseFloat(trackpoints[0].getAttribute("lon"));
                }

                for(var i = 0; i < trackpoints.length; i++) {
                    var lon = parseFloat(trackpoints[i].getAttribute("lon"));
                    var lat = parseFloat(trackpoints[i].getAttribute("lat"));

                    if(lon < minlon) minlon = lon;
                    if(lon > maxlon) maxlon = lon;
                    if(lat < minlat) minlat = lat;
                    if(lat > maxlat) maxlat = lat;
                }
            }

            if((minlat == maxlat) && (minlat == 0)) {
                map.centerAt(new Point( -122.942333,49.327667));
                return;
            }

            // Center around the middle of the points
            var centerlon = (maxlon + minlon) / 2;
            var centerlat = (maxlat + minlat) / 2;

            var extent = new esri.geometry.Extent({
                "xmin":minlon,"ymin":minlat,"xmax":maxlon,"ymax":maxlat,
                "spatialReference":{"wkid":4326}
              });
            map.setExtent(extent);

    });
}

GPXParser.prototype.addTrackpointsToMap = function() {

    var tracks = this.xmlDoc.documentElement.getElementsByTagName("trk");
    for(var i = 0; i < tracks.length; i++) {
        this.addTrackToMap(tracks[i], this.trackcolour, this.trackwidth);
    }
}

