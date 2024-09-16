import fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider} from "fastify-type-provider-zod";

import { createGoalRoute } from "./routes/create-goals";
import { createCompletionsRoute } from "./routes/create-completions";
import { getPendingGoalsRoute } from "./routes/get-pending-goals";
import { getWeekSummaryRoutes } from "./routes/get-week-sumarry";
import fastifyCors from "@fastify/cors";


const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors,{
    origin: '*'
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler)

app.register(createGoalRoute)
app.register(getPendingGoalsRoute)
app.register(createCompletionsRoute)
app.register(getWeekSummaryRoutes)

app.listen({
    port: 3333,
}).then(() => { 
    console.log('Http server running http://localhost:3333')
}) 

