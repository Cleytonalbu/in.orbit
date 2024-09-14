import dayjs from "dayjs";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

export async function getWeekPendingGoals(){

    const firstDayOfWeek = dayjs().startOf("week").toDate()
    const lastdayOfWeek = dayjs().endOf('week').toDate()

    // Buscando na tabela registros das metas criadas na semana.
    const goalsCreateUpToWeek = db.$with('goals_create_up_to_week').as(
        db
        .select({
            id: goals.id,
            title: goals.title,
            desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
            createdAt: goals.createdAt,

        })
        .from(goals)
        .where(lte(goals.createdAt, lastdayOfWeek))
    )

    // Buscando na tabale a contagem de metas completas.
    const goalCompletionCounts = db.$with('goal_completion_counts').as(
        db
        .select({
            goalId: goalCompletions.goalId,
            completionCount: count(goalCompletions.id).as('CompletionCount'),
            

        })
        .from(goalCompletions)
        .where(and(
            gte(goalCompletions.createdAt, firstDayOfWeek),
            lte(goalCompletions.createdAt, lastdayOfWeek)
        ))
        .groupBy(goalCompletions.goalId)
        
    )

    // QUERY principal
    const pendingGoals = await db
        .with(goalsCreateUpToWeek, goalCompletionCounts)
        .select({
            goalId: goalsCreateUpToWeek.id,
            title: goalsCreateUpToWeek.title,
            desiredWeeklyFrequency: goalsCreateUpToWeek.desiredWeeklyFrequency,
            completionCount: sql` 
              COALESCE(${goalCompletionCounts.completionCount}, 0)
            `.mapWith(Number)
        })
        .from(goalsCreateUpToWeek)
        .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goalsCreateUpToWeek.id))

    return {
         pendingGoals
    }
 }

