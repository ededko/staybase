import { createPublicMaintenanceTicket } from "@/app/actions/maintenance";
import { prisma } from "@/lib/prisma";

const categories=["Вода / сантехніка","Електрика","Замок / двері","Ліжко / меблі","Прибирання","Постіль / речі","Опалення","Інше"];

export default async function PublicMaintenancePage({searchParams}:{searchParams:Promise<{hostelId?:string;roomId?:string}>}){
 const params=await searchParams; const hostelId=Number(params.hostelId); const roomId=Number(params.roomId)||null;
 const hostel=hostelId?await prisma.hostel.findUnique({where:{id:hostelId},select:{id:true,name:true,address:true,rooms:{where:{id:roomId??-1},select:{id:true,name:true}}}}):null;
 const room=hostel?.rooms[0]??null;
 if(!hostel)return <div className="public-report-card"><div className="public-logo">S</div><h1>QR-код недійсний</h1><p>Зверніться до адміністратора хостелу.</p></div>;
 return <div className="public-report-card"><div className="public-logo">S</div><p className="eyebrow">STAYBASE · ДОПОМОГА</p><h1>Повідомити про проблему</h1><p className="public-location">🏢 {hostel.name}{room?` · кімната ${room.name}`:" · спільна зона"}</p>
 <form action={createPublicMaintenanceTicket} className="public-report-form"><input type="hidden" name="hostelId" value={hostel.id}/>{room&&<input type="hidden" name="roomId" value={room.id}/>}<input className="report-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/><label>Що сталося?<select name="category">{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Опишіть проблему<textarea name="description" required minLength={4} rows={4} placeholder="Наприклад: у ванній протікає кран"/></label><label>Наскільки терміново?<select name="priority"><option value="NORMAL">Звичайна заявка</option><option value="URGENT">Терміново — заважає проживанню</option><option value="LOW">Може почекати</option></select></label><div className="public-two"><label>Ваше ім’я<input name="reporterName" placeholder="Необов’язково"/></label><label>Телефон<input name="reporterPhone" inputMode="tel" placeholder="Необов’язково"/></label></div><label>Додати фото<input name="photo" type="file" accept="image/*" capture="environment"/></label><button>Надіслати заявку</button></form><p className="privacy-note">Реєстрація не потрібна. Заявка одразу потрапить адміністратору.</p></div>;
}
