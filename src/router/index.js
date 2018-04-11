import Vue from 'vue'
import Router from 'vue-router'
import ContainerPacking from '@/components/ContainerPacking'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ContainerPacking',
      component: ContainerPacking
    }
  ]
})
