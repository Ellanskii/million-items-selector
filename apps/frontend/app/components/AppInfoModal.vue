<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <UButton
    icon="i-lucide-circle-help"
    variant="ghost"
    color="neutral"
    size="sm"
    aria-label="О проекте"
    @click="open = true"
  />

  <UModal v-model:open="open" title="О проекте">
    <template #body>
      <div class="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h3:text-base prose-h3:mt-5 prose-h3:mb-1.5
                  prose-p:leading-relaxed prose-p:text-muted
                  prose-li:text-muted prose-li:leading-relaxed
                  prose-strong:text-highlighted
                  prose-ul:my-1.5 prose-ul:pl-5">
        <p>
          Приложение для управления большим списком элементов с поддержкой фильтрации,
          ручной сортировки и синхронизации состояния между вкладками.
        </p>

        <h3>Интерфейс</h3>
        <p>Два независимых окна:</p>
        <ul>
          <li><strong>Левое</strong> — все невыбранные элементы (ID 1–1 000 000 + добавленные вручную)</li>
          <li><strong>Правое</strong> — выбранные элементы в пользовательском порядке</li>
        </ul>

        <h3>Левое окно</h3>
        <ul>
          <li>Фильтрация по ID</li>
          <li>Бесконечная прокрутка, порции по 20 элементов</li>
          <li>Добавление элементов с произвольным ID</li>
        </ul>

        <h3>Правое окно</h3>
        <ul>
          <li>Фильтрация по ID</li>
          <li>Перетаскивание для изменения порядка (работает в том числе на отфильтрованном списке)</li>
          <li>Бесконечная прокрутка, порции по 20 элементов</li>
          <li>Порядок и выбор сохраняются между перезагрузками страницы (фильтр не сохраняется)</li>
        </ul>

        <h3>Общие принципы</h3>
        <ul>
          <li>Состояние хранится на сервере в памяти — без базы данных</li>
          <li>Данные общие для всех посетителей, авторизация не требуется</li>
          <li>Запросы проходят через очередь с дедупликацией: одно значение не добавляется дважды</li>
          <li>Батчинг: создание элементов раз в 10 секунд, остальные операции — раз в секунду</li>
        </ul>

        <h3>Стек</h3>
        <ul>
          <li>Backend: Express.js (TypeScript)</li>
          <li>Frontend: Nuxt 4, Vue 3, TypeScript, Pinia, Vue Query</li>
          <li>Контракт: OpenAPI → сгенерированный TypeScript-клиент</li>
        </ul>
      </div>
    </template>
  </UModal>
</template>
