const asynchandler = (requesthandler) => {
    return (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next))
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