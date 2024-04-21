<script setup lang="ts">
const props = defineProps<{
    targetId: string;
    callback: () => void;
}>();

const scrollToElement = () => {
    const el = document.getElementById(props.targetId);

    if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        props.callback();
    }
};
</script>

<template>
    <button class="text-left hover:bg-gray-200" @click="scrollToElement()">
        <slot></slot>
    </button>
</template>
