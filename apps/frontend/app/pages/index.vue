<script setup lang="ts">
const store = useItemsStore()
onMounted(() => store.refresh())
</script>

<template>
  <div style="display:flex;gap:60px;padding:24px">

    <section>
      <h2>Items ({{ store.totalUnselected }} unselected)</h2>
      <ul>
        <li v-for="item in store.items" :key="item.id">
          {{ item.id }}
          <button @click="store.select(item.id)">+</button>
        </li>
      </ul>
      <div>
        <button :disabled="store.page <= 1" @click="store.prevPage()">←</button>
        page {{ store.page }}
        <button @click="store.nextPage()">→</button>
      </div>
    </section>

    <section>
      <h2>Selected ({{ store.selected.length }})</h2>
      <ul>
        <li v-for="item in store.selected" :key="item.id">
          {{ item.id }}
          <button @click="store.unselect(item.id)">−</button>
        </li>
      </ul>
    </section>

  </div>
</template>
