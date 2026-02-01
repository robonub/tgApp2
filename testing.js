function func(){
    console.log(this)
}

const item = {name: "ABC"}
func.call(item)