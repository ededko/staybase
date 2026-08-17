import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();

    const hostel = await prisma.hostel.create({
      data: {
        name: body.name,
        address: body.address,
        workspaceId: workspace.id,
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
