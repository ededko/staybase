"use client";

import { useMemo, useState } from "react";

export type BedOption = {
  id: number;
  number: number;
  roomId: number;
  roomName: string;
  hostelId: number;
  hostelName: string;
};

type ResidentValues = {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  checkIn: string;
  checkOut: string;
  bedId?: number | null;
};

type Props = {
  beds: BedOption[];
  resident?: ResidentValues;
};

export default function ResidentFormFields({ beds, resident }: Props) {
  const initialBed = beds.find((bed) => bed.id === resident?.bedId);
  const [hostelId, setHostelId] = useState(initialBed?.hostelId?.toString() ?? "");
  const [roomId, setRoomId] = useState(initialBed?.roomId?.toString() ?? "");
  const [bedId, setBedId] = useState(initialBed?.id?.toString() ?? "");

  const hostels = useMemo(
    () => Array.from(new Map(beds.map((bed) => [bed.hostelId, bed.hostelName])).entries()),
    [beds]
  );
  const rooms = useMemo(
    () => Array.from(new Map(beds.filter((bed) => bed.hostelId === Number(hostelId)).map((bed) => [bed.roomId, bed.roomName])).entries()),
    [beds, hostelId]
  );
  const availableBeds = beds.filter((bed) => bed.roomId === Number(roomId));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <input name="firstName" required defaultValue={resident?.firstName ?? ""} placeholder="Ім’я" className="w-full rounded-lg border p-3" />
        <input name="lastName" required defaultValue={resident?.lastName ?? ""} placeholder="Прізвище" className="w-full rounded-lg border p-3" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input name="phone" defaultValue={resident?.phone ?? ""} placeholder="Телефон" className="w-full rounded-lg border p-3" />
        <input type="email" name="email" defaultValue={resident?.email ?? ""} placeholder="Email" className="w-full rounded-lg border p-3" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-600">Примітки</label>
        <textarea name="notes" rows={3} defaultValue={resident?.notes ?? ""} className="w-full rounded-lg border p-3" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Дата заселення</label>
          <input type="date" name="checkIn" required defaultValue={resident?.checkIn ?? ""} className="w-full rounded-lg border p-3" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Планова дата виїзду</label>
          <input type="date" name="checkOut" defaultValue={resident?.checkOut ?? ""} className="w-full rounded-lg border p-3" />
        </div>
      </div>

      <div id="accommodation" className="space-y-4 border-t pt-5">
        <h2 className="text-xl font-bold">Розміщення</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <select
            name="hostelId"
            required
            value={hostelId}
            onChange={(event) => {
              setHostelId(event.target.value);
              setRoomId("");
              setBedId("");
            }}
            className="rounded-lg border p-3"
          >
            <option value="">Оберіть хостел</option>
            {hostels.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>

          <select
            name="roomId"
            required
            value={roomId}
            onChange={(event) => {
              setRoomId(event.target.value);
              setBedId("");
            }}
            disabled={!hostelId}
            className="rounded-lg border p-3 disabled:bg-slate-100"
          >
            <option value="">Оберіть кімнату</option>
            {rooms.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>

          <select
            name="bedId"
            required
            value={bedId}
            onChange={(event) => setBedId(event.target.value)}
            disabled={!roomId}
            className="rounded-lg border p-3 disabled:bg-slate-100"
          >
            <option value="">Оберіть ліжко</option>
            {availableBeds.map((bed) => <option key={bed.id} value={bed.id}>Ліжко {bed.number}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
