"use client";

import {useEffect, useRef, useState} from 'react';
import type {Map as LeafletMap} from 'leaflet';
import {MapPin} from 'lucide-react';
import {useI18n} from '@/lib/i18n';
import {directionsLinks, kioskLocations, regionalHubs, type Departure} from '@/lib/locations';

export function DepartureMap({departure}: {departure:string}) {
  const {t,lang} = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const activeDeparture = departure in regionalHubs ? departure as Departure : 'Sunny Beach';
  const latestDeparture = useRef(activeDeparture);
  latestDeparture.current = activeDeparture;
  const [status,setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [tileError,setTileError] = useState(false);
  const [attempt,setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let instance: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;
    setStatus('loading');
    setTileError(false);
    import('leaflet').then(L => {
      if (disposed || !host.current) return;
      instance = L.map(host.current, {scrollWheelZoom:false, zoomControl:false})
        .setView(regionalHubs[latestDeparture.current],14);
      map.current = instance;
      L.control.zoom({zoomInTitle:t('zoomIn'),zoomOutTitle:t('zoomOut')}).addTo(instance);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:19,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).on('tileerror',()=>{if(!disposed)setTileError(true)}).addTo(instance);

      for (const [index,kiosk] of kioskLocations.entries()) {
        const icon = L.divIcon({
          className:`kiosk-marker kiosk-marker-${kiosk.kind}`,
          html:`<span aria-hidden="true">${index+1}</span>`,
          iconSize:[34,42],iconAnchor:[17,42],popupAnchor:[0,-40],
        });
        const content = document.createElement('div');
        content.className = 'kiosk-popup-content';
        const heading = document.createElement('h3');
        heading.textContent = kiosk.name;
        const region = document.createElement('p');
        region.textContent = t(kiosk.departure==='Sunny Beach'?'sunny':kiosk.departure==='Nessebar'?'nessebar':'burgas');
        const actions = document.createElement('div');
        actions.className = 'kiosk-directions';
        const links = directionsLinks(kiosk.coordinates);
        for (const [url,label] of [[links.google,t('googleDirections')],[links.apple,t('appleDirections')]]) {
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = label;
          actions.appendChild(link);
        }
        content.appendChild(heading);
        content.appendChild(region);
        content.appendChild(actions);
        const marker = L.marker(kiosk.coordinates, {icon,title:kiosk.name,alt:kiosk.name,keyboard:true,riseOnHover:true})
          .bindPopup(content, {className:'kiosk-popup',minWidth:200,maxWidth:280,autoPanPadding:[20,20]})
          .addTo(instance);
        marker.getElement()?.setAttribute('data-number',String(index+1));
        marker.getElement()?.setAttribute('aria-label',kiosk.name);
      }
      const element = host.current;
      resize = new ResizeObserver(()=>instance?.invalidateSize({pan:false}));
      resize.observe(element);
      setStatus('ready');
    }).catch(()=>{if(!disposed)setStatus('error')});
    return () => {
      disposed = true;
      resize?.disconnect();
      instance?.remove();
      if(map.current===instance)map.current=null;
    };
  },[lang,t,attempt]);

  useEffect(() => {
    if(status!=='ready'||!map.current)return;
    map.current.closePopup();
    map.current.stop().flyTo(regionalHubs[activeDeparture],14,{
      duration:1.15,animate:!window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  },[activeDeparture,status]);

  return <section className="departure-map" aria-labelledby="departure-map-title">
    <div className="map-heading"><div><MapPin size={20}/><h2 id="departure-map-title">{t('mapTitle')}</h2></div><span>{t('mapDemo')}</span></div>
    <div className="map-frame">
      <div ref={host} className="map-canvas" role="region" aria-label={`${t('mapTitle')} — ${t(activeDeparture==='Sunny Beach'?'sunny':activeDeparture==='Nessebar'?'nessebar':'burgas')}`}/>
      {status!=='ready'&&<div className="map-feedback" role="status"><p>{t(status==='error'?'mapError':'mapLoading')}</p>{status==='error'&&<button className="quiet-button" onClick={()=>setAttempt(v=>v+1)}>{t('retry')}</button>}</div>}
    </div>
    {tileError&&<p className="map-tile-error" role="status">{t('mapTilesError')} <button onClick={()=>setAttempt(v=>v+1)}>{t('retry')}</button></p>}
  </section>;
}
