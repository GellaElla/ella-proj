import { useState } from "react";

function Person(Props){
    const[count,setCount]=useState(0)
    const[message,setMessage]=useState('')

    return(
        <>
        <h1>HI MY NAME IS {Props.name}</h1>

        <hr/>

        <h2>Quantity: {count}</h2>

        <button onClick={()=>setCount(count + 1)}>+</button>
         <button onClick={()=>setCount(Math.max(0,count - 1))}>-</button>

         <hr/>
         <input type = "text" value={message} placeholder="Enter Messsage"
         onChange={(e)=>setMessage(e.target.value)}/>

         <button onClick={()=>setMessage('')}>Clear</button>

         <h3>Message: {message}</h3>
        </>
        
    )
}
export default Person