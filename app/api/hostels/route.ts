import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const hostel = await prisma.hostel.create({
      data: {
        name: body.name,
        address: body.address,
      },
    });

    return NextResponse.json(hostel, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Не вдалося створити хостел" },
      { status: 500 }
    );
  }
}