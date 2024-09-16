import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import dayjs from "dayjs";


export async function getWeekSummary() {

    const firstDayOfWeek = dayjs().startOf("week").toDate()
    const lastdayOfWeek = dayjs().endOf('week').toDate()

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

    const goalsCompletedInWeek = db.$with('goal_completed_in_week').as(
        db
        .select({
           id: goalCompletions.id,
           title: goals.title,
           completedAt: goalCompletions.createdAt,
           completedAtDate: sql/*sql*/`
                DATE(${goalCompletions.createdAt})
           `.as("completedAtDate"),
        })
        .from(goalCompletions)
        .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
        .where(and(
            gte(goalCompletions.createdAt, firstDayOfWeek),
            lte(goalCompletions.createdAt, lastdayOfWeek)
        ))
        
        
    )

    const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
        db
            .select({
                completedAtDate: goalsCompletedInWeek.completedAtDate,
                completions: sql /*sql*/`
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', ${goalsCompletedInWeek},
                            'title', ${goalsCompletedInWeek.title},
                            'completedAt', ${goalsCompletedInWeek.completedAt} 
                        )
                    )
                `.as('completions'),
            })
            .from(goalsCompletedInWeek)
            .groupBy(goalsCompletedInWeek.completedAtDate)
    )

    const result = await db
        .with(goalsCreateUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
        .select({
            
            completed: sql /*sql*/`
                (SELECT COUNT(*) FROM ${goalsCompletedInWeek})
                `.mapWith(Number),
           
           TOTAL: sql/*sql*/`
                (SELECT SUM(${goalsCreateUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreateUpToWeek})
                `.mapWith(Number),
            
            goalsPerDay: sql/*sql*/`
                JSON_OBJECT_AGG(
                    ${goalsCompletedByWeekDay.completedAtDate},
                    ${goalsCompletedByWeekDay.completions}
                )                
                `
        })
        .from(goalsCompletedByWeekDay)

    return {
        summary: result

    }
}