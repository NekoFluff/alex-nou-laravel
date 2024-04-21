<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';

import Card from '@/Components/Card.vue';
import GenericLayout from '@/Layouts/GenericLayout.vue';
import SocialMediaBar from '@/Components/SocialMediaBar.vue';
</script>

<template>
    <Head title="Alex Nou" />
    <GenericLayout>
        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="flex justify-center my-40 text-3xl font-extralight">
                    <span class="font-bold">Hello</span>, my name is
                    <div class="font-bold">&nbspAlex</div>
                    .
                </div>

                <Card>
                    <template #header>
                        <h1 class="text-2xl font-bold">Who am I?</h1>
                    </template>
                    <ul>
                        <li>- A code junkie</li>
                        <li>- Software engineer for RevolutionParts</li>
                        <li>- ASU Graduate (4.0 / Moeur Award)</li>
                        <li>
                            - An advocator for domain based architectures and clean, well-tested,
                            and maintainable code. It pays off in the long run.
                        </li>
                    </ul>
                </Card>
                <Card>
                    <template #header>
                        <h1 class="text-2xl font-bold">Programming Languages</h1>
                    </template>
                    <div class="text-lg font-bold">Recently used</div>
                    <ul>
                        <li>- golang</li>
                        <li>- php</li>
                        <li>- javascript/typescript</li>
                    </ul>
                    <div class="mt-4 text-lg font-bold">Rusty/Some experience</div>
                    <ul>
                        <li>- swift & objective-c</li>
                        <li>- python</li>
                        <li>- lua</li>
                        <li>- c/c++</li>
                        <li>- c#</li>
                        <li>- java</li>
                    </ul>
                </Card>
                <Card>
                    <template #header>
                        <h1 class="text-2xl font-bold">Other relevant technologies/tools</h1>
                    </template>
                    <div class="text-lg font-bold"></div>
                    <ul>
                        <li>- mysql/postgres</li>
                        <li>- mongodb (certified)</li>
                        <li>- helm</li>
                        <li>- argo</li>
                        <li>- tensorflow/pandas/keras</li>
                    </ul>
                </Card>
                <Card>
                    <template #header>
                        <h1 class="text-2xl font-bold">Interests</h1>
                    </template>
                    <div class="text-lg font-bold"></div>
                    <ul>
                        <li>- machine learning (neural networks, specifically CNNs)</li>
                        <li>
                            - games (apex legends, dyson sphere program, factorio, monster hunter)
                        </li>
                        <li>- anime (sangatsu no lion, kimi no na wa, zelda BotW)</li>
                    </ul>
                </Card>
            </div>
        </div>
    </GenericLayout>
</template>
