// Data Migration Script: JSON to Supabase
// Run this script to migrate your quiz data to Supabase

import { supabase } from './public/js/supabase-client.js';
import fs from 'fs';
import path from 'path';

class DataMigrator {
    constructor() {
        this.modules = [
            { name: 'intro-ai', display_name: 'Introduction to AI', icon: 'fas fa-brain', color: '#FF6B6B' },
            { name: 'database', display_name: 'Database Systems', icon: 'fas fa-database', color: '#4ECDC4' },
            { name: 'differential', display_name: 'Differential Equations', icon: 'fas fa-calculator', color: '#45B7D1' },
            { name: 'statistics', display_name: 'Applied Statistics', icon: 'fas fa-chart-bar', color: '#96CEB4' },
            { name: 'os', display_name: 'Operating Systems', icon: 'fas fa-desktop', color: '#FFEAA7' },
            { name: 'architecture', display_name: 'Computer Architecture', icon: 'fas fa-microchip', color: '#DDA0DD' },
            { name: 'networking', display_name: 'Data Communication', icon: 'fas fa-network-wired', color: '#98D8C8' },
            { name: 'thermodynamics', display_name: 'Thermodynamics', icon: 'fas fa-fire', color: '#F7DC6F' }
        ];
    }

    async migrateAll() {
        console.log('Starting data migration...');
        
        try {
            // 1. Migrate modules
            await this.migrateModules();
            
            // 2. Migrate quizzes and questions
            await this.migrateQuizzes();
            
            console.log('✅ Migration completed successfully!');
        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }

    async migrateModules() {
        console.log('Migrating modules...');
        
        for (let i = 0; i < this.modules.length; i++) {
            const module = { ...this.modules[i], sort_order: i + 1 };
            
            const { error } = await supabase
                .from('modules')
                .upsert(module, { onConflict: 'name' });
                
            if (error) {
                console.error(`Error migrating module ${module.name}:`, error);
            } else {
                console.log(`✓ Migrated module: ${module.display_name}`);
            }
        }
    }

    async migrateQuizzes() {
        console.log('Migrating quizzes...');
        
        for (const module of this.modules) {
            const quizDir = path.join('quizes', module.name);
            
            if (!fs.existsSync(quizDir)) {
                console.log(`⚠️  Quiz directory not found: ${quizDir}`);
                continue;
            }
            
            const files = fs.readdirSync(quizDir)
                .filter(file => file.endsWith('.json'));
                
            for (const file of files) {
                await this.migrateQuizFile(module, file);
            }
        }
    }

    async migrateQuizFile(module, filename) {
        try {
            const filePath = path.join('quizes', module.name, filename);
            const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (!Array.isArray(quizData) || quizData.length === 0) {
                console.log(`⚠️  Invalid quiz data in ${filePath}`);
                return;
            }

            const quizNumber = filename.replace('.json', '');
            
            // Get module ID
            const { data: moduleData, error: moduleError } = await supabase
                .from('modules')
                .select('id')
                .eq('name', module.name)
                .single();
                
            if (moduleError) {
                console.error(`Error finding module ${module.name}:`, moduleError);
                return;
            }

            // Insert quiz
            const { data: quizInserted, error: quizError } = await supabase
                .from('quizzes')
                .upsert({
                    module_id: moduleData.id,
                    quiz_number: quizNumber,
                    title: `${module.display_name} Quiz ${quizNumber}`,
                    total_questions: quizData.length,
                    difficulty_level: 'medium',
                    passing_score: 60
                }, { onConflict: 'module_id,quiz_number' })
                .select()
                .single();
                
            if (quizError) {
                console.error(`Error inserting quiz ${module.name}/${quizNumber}:`, quizError);
                return;
            }

            console.log(`✓ Migrated quiz: ${module.name}/${quizNumber}`);

            // Insert questions
            for (let i = 0; i < quizData.length; i++) {
                const question = quizData[i];
                await this.migrateQuestion(quizInserted.id, question, i + 1);
            }
            
        } catch (error) {
            console.error(`Error migrating ${filename}:`, error);
        }
    }

    async migrateQuestion(quizId, questionData, questionNumber) {
        try {
            // Insert question
            const { data: questionInserted, error: questionError } = await supabase
                .from('questions')
                .upsert({
                    quiz_id: quizId,
                    question_number: questionNumber,
                    question_id: questionData.id,
                    question_text: questionData.text,
                    correct_answer: questionData.correctAnswer,
                    explanation: questionData.explanation,
                    points: 1
                }, { onConflict: 'quiz_id,question_number' })
                .select()
                .single();
                
            if (questionError) {
                console.error(`Error inserting question:`, questionError);
                return;
            }

            // Insert options
            if (questionData.options && Array.isArray(questionData.options)) {
                for (let j = 0; j < questionData.options.length; j++) {
                    const { error: optionError } = await supabase
                        .from('question_options')
                        .upsert({
                            question_id: questionInserted.id,
                            option_number: j,
                            option_text: questionData.options[j],
                            is_correct: j === questionData.correctAnswer
                        }, { onConflict: 'question_id,option_number' });
                        
                    if (optionError) {
                        console.error(`Error inserting option:`, optionError);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error migrating question:', error);
        }
    }
}

// Run migration
const migrator = new DataMigrator();
migrator.migrateAll();