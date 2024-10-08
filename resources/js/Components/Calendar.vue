<script setup lang="ts">
import { LevelProgression } from '@/types/levelProgression';
import { CalendarComponent } from 'v-calendar/dist/types/tests/unit/specs/utils.js';
import { onMounted, ref } from 'vue';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
}>();

const calendar = ref<CalendarComponent>();
const attributes = ref<any[]>([]);
const startDate = new Date(2024, 3, 9);

const buildAttributes = () => {
    const dayInterval = 12;
    for (let i = 1; i <= 60; i++) {
        attributes.value.push({
            key: `Goal: Level ${i} Complete`,
            popover: {
                label:
                    props.currentLevel > i
                        ? `Goal Met: Level ${i} Complete`
                        : `Goal: Level ${i} Complete`,
            },
            highlight: props.currentLevel > i ? 'yellow' : 'red',
            dates: new Date(startDate.getTime() + dayInterval * i * 24 * 60 * 60 * 1000),
            order: 2,
        });
    }

    props.levelProgressions.forEach((levelProgression) => {
        if (levelProgression.started_at === null) return;

        if (levelProgression.passed_at === null) {
            attributes.value.push({
                key: 'Current Level',
                highlight: 'blue',
                dates: [[levelProgression.started_at, new Date()]],
                popover: {
                    label: `Currently Level ${props.currentLevel}`,
                },
                order: 1,
            });
        } else {
            attributes.value.push({
                key: `Level ${levelProgression.level} Complete`,
                highlight: 'green',
                dates: [[levelProgression.started_at, levelProgression.passed_at]],
                popover: {
                    label: `Level ${levelProgression.level} Complete`,
                },
                order: 0,
            });
        }
    });
};

onMounted(() => {
    buildAttributes();
    calendar.value.move(new Date(startDate.getFullYear(), 0, 1));
});

const isMobile = window.innerWidth < 640;
</script>

<template>
    <div class="pt-12 mx-8">
        <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <VCalendar
                ref="calendar"
                expanded
                :rows="isMobile ? 12 : 4"
                :columns="isMobile ? 1 : 3"
                :min-date="new Date(2023, 3, 20)"
                :max-date="new Date(2026, 3, 20)"
                :attributes="attributes"
            />
            <!-- <VDatePicker v-model="date" /> -->
        </div>
    </div>
</template>
