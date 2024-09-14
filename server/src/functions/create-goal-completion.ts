import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import dayjs from "dayjs";


interface CreateGoalCompletionRequest{
   goalId: string
}

export async function createGoalCompletion({ goalId }: CreateGoalCompletionRequest) {

   const firstDayOfWeek = dayjs().startOf("week").toDate()
   const lastdayOfWeek = dayjs().endOf('week').toDate()

   const goalCompletionCounts = db.$with('goal_completion_counts').as(
      db
      .select({
          goalId: goalCompletions.goalId,
          completionCount: count(goalCompletions.id).as('CompletionCount'),
          

      })
      .from(goalCompletions)
      .where(and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastdayOfWeek),
          eq(goalCompletions.goalId, goalId)
      ))
      .groupBy(goalCompletions.goalId)
      
  )
   const result = db
      .with(goalCompletionCounts)
      .select({
         desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
         completionCount: sql` 
           COALESCE(${goalCompletionCounts.completionCount}, 0)
         `.mapWith(Number)
      })
      .from(goals)
      .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
      .where(eq(goalCompletions.goalId, goalId))

      const [] = result[0]

      return { result }
      
   }     
   