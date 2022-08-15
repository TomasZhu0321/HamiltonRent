//when 'catch' error, pass 'error' to 'next' middleware

module.exports = func =>{
    return (req,res,next) =>{
        func(req,res,next).catch(next);
    }
}