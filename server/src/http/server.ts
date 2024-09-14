import fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider} from "fastify-type-provider-zod";
import { createGoal } from "../functions/create-goal";
import z from "zod";
import { getWeekPendingGoals } from "../functions/get-week-pending-goals";
import { createGoalCompletion } from "../functions/create-goal-completion";

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler)

//Metas pendentes
app.get('/pending-goals', async ()=>{
    const { pendingGoals } = await getWeekPendingGoals()
    
    return pendingGoals
    
})

// Cadastro de meta
app.post('/goals',{ 
    schema: {
        body: 
            z.object({
            title: z.string(),
            desiredWeeklyFrequency: z.number().int().min(1).max(7),
            })   
    }         
} ,async (request)=>{
    
    const {title, desiredWeeklyFrequency} = request.body 

    await createGoal({
        title,
        desiredWeeklyFrequency,
    })
} )

// Adicionar Metas compridas 
app.post('/completions', {
    schema: {
        body: z.object({
            goalId: z.string(),
        })
    }
}, async (request)=>{
    const {goalId} = request.body

    await createGoalCompletion({
        goalId,
    })
    
} )







app.listen({
    port: 3333,
}).then(() => { 
    console.log('Http server running http://localhost:3333')
}) 

