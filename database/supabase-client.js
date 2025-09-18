import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js'
import express from 'express';
const app = express();
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;