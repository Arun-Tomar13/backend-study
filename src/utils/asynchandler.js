const asynchandler = (requesthandler) => {
    (rq,res,next)=>{
        Promise.response(requesthandler(req,res,next))
        .catch((err)=> next(err));
    }
}

export {asynchandler}

// const asynchandler = (requesthandler) => async (req,res,next)=>{
//     try{

//     }
//     catch(error){
//         console.log(err)

//     }
// }