//Funcion que carga el gpx, con la extension modificada a xml
function loadGPX(){
    $.ajax({
    url: GX.params.gpxURI,
    dataType: "xml",
    success: function(data) {
      var parser = new GPXParser(data, GX.map);
      parser.centerAndZoom(data);
      parser.addTrackpointsToMap();

    }
  });
}


// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;



// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  //event.target.playVideo();
  require(["esri/map",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/Color",
  "esri/graphic",
  "esri/layers/GraphicsLayer",
  "esri/symbols/PictureMarkerSymbol"], 
  function(Map,SimpleMarkerSymbol,Color,Graphic,GraphicsLayer,PictureMarkerSymbol) {
    
    if(typeof(Worker) !== "undefined")
    {
      if(typeof(w) == "undefined")
      {
        w = new Worker("js/work.js");
      }
      w.onmessage = function (event){
        var tiempo=player.getCurrentTime();
        document.getElementById("vaporSegundos").value =tiempo;
        if(tiempo>0){
          if(GX.pasada==0){
            punto=GX.arraySegundos[0];
            GX.pasada=1;
          }else{
            tiempo=tiempo | 0;
            GX.puntoAnterior=punto;
            punto=GX.arraySegundos[tiempo-GX.segundoComienzo];
            GX.PuntosPos.clear();

            aux=calculoAngulo(GX.puntoAnterior.x,GX.puntoAnterior.y,punto.x,punto.y);
            if(aux!=0 && !isNaN(aux)){
              GX.valor=aux;
              document.getElementById("angulo").value=GX.valor;
            }

          }
          //Nuevo ahora con icono personalizado
          var pictureMarkerSymbol = new PictureMarkerSymbol(iconMarker, 20, 20);
          pictureMarkerSymbol.angle=GX.valor;
          var graphic = new Graphic(punto, pictureMarkerSymbol);  
          GX.PuntosPos.add(graphic);

          /*var sms = new SimpleMarkerSymbol();
          sms.setColor(new esri.Color([255,0,0,1]))
          var graphic = new Graphic(punto, sms);  
          GX.PuntosPos.add(graphic);*/
          map.centerAt(punto);
         

        }
      };
    }
    else
    {
      document.getElementById("vaporSegundos").value="Sorry, your browser does not support Web Workers...";
    }

    /*map = new Map("mapMain", {
      basemap: mapType,
      center: mapCenter, // longitude, latitude
      zoom: zoomLevel
    });*/
    map = GX.map;

    GX.PuntosPos = new GraphicsLayer();
    map.addLayer(GX.PuntosPos);

    GX.lgisCapaVerticesGPX = new GraphicsLayer();
    map.addLayer(GX.lgisCapaVerticesGPX);

    GX.lgisCapaVerticesGPX.on("click",function(evt){
      segundo=evt.graphic.attributes.hora;
      player.seekTo(segundo+parseInt(GX.segundoComienzo));
    });

    $.event.trigger({
      type: "GPXReady"
    });
    //Capturamos el evento load para que se carga el GPX al inicio 
    map.on("load",function(){
      
    });

  });
}


function calculoAngulo(x0,y0,x1,y1){
  Pi=4*Math.atan(1);
  Az=Math.atan((x1 - x0) / (y1 - y0)) * 200 / Pi ;
  if((y1 - y0) < 0) 
    Az = Az + 200 
  if (((y1 - y0) > 0) && ((x1 - x0) < 0))
    Az = Az + 400 
  return Az +60;
}

