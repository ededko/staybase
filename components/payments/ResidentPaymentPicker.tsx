"use client";

import { useMemo, useState } from "react";

type ResidentOption = { id:number; name:string; phone:string; hostelId:number|null; hostelName:string; roomName:string; bedNumber:number|null; paidThrough:string };

export default function ResidentPaymentPicker({ residents, hostels, initialId = "" }: { residents:ResidentOption[]; hostels:{id:number;name:string}[]; initialId?:string }) {
  const [hostelId,setHostelId]=useState(""); const [query,setQuery]=useState(""); const [residentId,setResidentId]=useState(initialId);
  const filtered=useMemo(()=>{const needle=query.trim().toLocaleLowerCase("uk"); return residents.filter(r=>(!hostelId||r.hostelId===Number(hostelId))&&(!needle||`${r.name} ${r.phone}`.toLocaleLowerCase("uk").includes(needle)));},[residents,hostelId,query]);
  return <div className="resident-picker rounded-xl border p-4"><div className="grid gap-3 md:grid-cols-2"><label>Хостел<select value={hostelId} onChange={e=>{setHostelId(e.target.value);setResidentId("");}}><option value="">Усі хостели</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Пошук<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ім’я, прізвище або телефон"/></label></div><label className="mt-3 block">Мешканець<select name="residentId" required value={residentId} onChange={e=>setResidentId(e.target.value)}><option value="">Оберіть мешканця ({filtered.length})</option>{filtered.map(r=><option key={r.id} value={r.id}>{r.name} — {r.hostelName}, {r.roomName}{r.bedNumber?`, ліжко ${r.bedNumber}`:""}{r.paidThrough?` · оплачено до ${r.paidThrough}`:""}</option>)}</select></label></div>;
}
