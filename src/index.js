import Vue from "vue";

let vm = new Vue({
  template:"<div><div>{{fullName}}</div><button @click='alterText'>点我测试</button><input type='text' @change=''></div>",
  el:'#app',//表示要渲染的元素是app
  data(){
    return {
      msg:'hello',
      person:{name:'lrx',age:23},
      arr:[[1],2,3],
      firstName:'李',
      lastName:'荣想',
      num:0
    }
  },
  computed:{
    fullName(){
      return this.firstName + this.lastName
    }
  },
  methods:{
    alterText(){
      console.log('111111');
      
      alert('成功！！！！')
    },
    findNum(e){
      console.log(e);
      
    }
  }
  // watch:{
  //   msg(newValue,oldValue){
  //     console.log(newValue,oldValue)
  //   }
  // }
})
setTimeout(() => {
  vm.lastName = '先生'
}, 1000);
