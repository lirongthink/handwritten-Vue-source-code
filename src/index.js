import Vue from "vue";

let ChildComponent = {
  template:`<div>
    <div>具名插槽的内容为：<slot name = "haveName"></slot></div>
    <div>默认插槽在这<slot></slot></div>
  </div>`
}
let A = {
  template:`<div>A Comp</div>`,
  name:'A',
  mounted(){
    console.log('Comp A mounted')
  },
  activated(){
    console.log('Comp A activated')
  },
  deactivated(){
    console.log('Comp A deactivated')
  }
}
let B = {
  template:`<div>B Comp</div>`,
  name:'B',
  mounted(){
    console.log('Comp B mounted')
  },
  activated(){
    console.log('Comp B activated')
  },
  deactivated(){
    console.log('Comp B deactivated')
  }
}
let vm = new Vue({
  template:`<div>
    <div>{{fullName}}</div>
    <span>{{test}}</span>
    <button @click='alterText'>点我测试</button>
    <keep-alive>
      <component :is="currentComp">
      </component>
    </keep-alive>
    <button @click='changeComponent'>切换组件</button>
    <child-component>
      <h1 slot="haveName">{{title}}</h1>
      <span>{{context}}</span>
    </child-component>
    <input v-model='test'/>
  </div>`,
  el:'#app',//表示要渲染的元素是app
  data(){
    return {
      msg:'hello',
      person:{name:'lrx',age:23},
      arr:[[1],2,3],
      firstName:'李',
      lastName:'荣想',
      test:'',
      num:0,
      title:'插槽插槽',
      context:'啦啦啦啦啦',
      currentComp:'A'
    }
  },
  computed:{
    fullName(){
      return this.firstName + this.lastName
    }
  },
  components:{
    ChildComponent,
    A,
    B
  },
  methods:{
    alterText(){
      console.log('111111');
      
      alert('成功！！！！')
    },
    changeComponent(){
      this.currentComp = this.currentComp === 'A' ? 'B' : 'A'
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
