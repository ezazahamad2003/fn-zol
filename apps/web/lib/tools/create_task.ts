import type { CreateTaskInput, CreateTaskOutput, ToolHandler } from "@/lib/tools/types";

export const createTask: ToolHandler<CreateTaskInput, CreateTaskOutput> = async (ctx, input) => {
  if (!input.title) throw new Error("create_task: title is required");

  const { data, error } = await ctx.supabase
    .from("tasks")
    .insert({
      tenant_id:   ctx.tenantId,
      call_id:     ctx.callId,
      title:       input.title,
      description: input.description ?? null,
      assigned_to: input.assigned_to ?? null,
      due_at:      input.due_at ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { task_id: data.id };
};
