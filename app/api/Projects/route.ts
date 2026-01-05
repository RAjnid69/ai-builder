import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AppDataSource } from "@/lib/db/data-source";
import { Project } from "@/lib/db/entities/Project";
import { User } from "@/lib/db/entities/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const db = await AppDataSource();

    const userRepo = db.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const repo = db.getRepository(Project);

    const project = repo.create({
      name: body.name || "Untitled Project",
      frontendFiles: body.files || {},
      backendFiles: {},
      user: user,
    });

    await repo.save(project);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const db = await AppDataSource();
    const repo = db.getRepository(Project);

    // If ID is provided, fetch single project
    if (id) {
      const project = await repo.findOne({
        where: { id, user: { id: userId } },
        relations: ["user"],
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      return NextResponse.json(project);
    }

    // Otherwise, fetch all user projects
    const projects = await repo.find({
      where: { user: { id: userId } },
      relations: ["user"],
      order: { updatedAt: "DESC" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, frontendFiles, backendFiles } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const db = await AppDataSource();
    const repo = db.getRepository(Project);

    const project = await repo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update name if provided
    if (name !== undefined) {
      project.name = name;
    }

    // Update files if provided
    if (frontendFiles !== undefined) {
      project.frontendFiles = frontendFiles;
    }

    if (backendFiles !== undefined) {
      project.backendFiles = backendFiles;
    }

    await repo.save(project);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, frontendFiles, backendFiles } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const db = await AppDataSource();
    const repo = db.getRepository(Project);

    const project = await repo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update files
    if (frontendFiles !== undefined) {
      project.frontendFiles = frontendFiles;
    }

    if (backendFiles !== undefined) {
      project.backendFiles = backendFiles;
    }

    await repo.save(project);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error saving project files:", error);
    return NextResponse.json(
      { error: "Failed to save project" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const db = await AppDataSource();
    const repo = db.getRepository(Project);

    const project = await repo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await repo.remove(project);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
