import Vue from "vue";

let vm = new Vue({
  template:"<div>{{fullName}}</div>",
  el:'#app',//表示要渲染的元素是app
  data(){
    return {
      msg:'hello',
      person:{name:'lrx',age:23},
      arr:[[1],2,3],
      firstName:'李',
      lastName:'荣想'
    }
  },
  computed:{
    fullName(){
      console.log('fullName')
      return this.firstName + this.lastName
    }
  },
  // watch:{
  //   msg(newValue,oldValue){
  //     console.log(newValue,oldValue)
  //   }
  // }
})
setTimeout(() => {
  vm.lastName = '先生'
}, 1000);
