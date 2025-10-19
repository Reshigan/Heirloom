import daisyui from 'daisyui';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				constellation: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49'
				},
				legacy: {
					50: '#fefce8',
					100: '#fef9c3',
					200: '#fef08a',
					300: '#fde047',
					400: '#facc15',
					500: '#eab308',
					600: '#ca8a04',
					700: '#a16207',
					800: '#854d0e',
					900: '#713f12',
					950: '#422006'
				}
			},
			animation: {
				'constellation-pulse': 'constellation-pulse 3s ease-in-out infinite',
				'memory-float': 'memory-float 6s ease-in-out infinite',
				'legacy-glow': 'legacy-glow 2s ease-in-out infinite alternate'
			},
			keyframes: {
				'constellation-pulse': {
					'0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
					'50%': { opacity: '1', transform: 'scale(1.05)' }
				},
				'memory-float': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-10px) rotate(2deg)' },
					'66%': { transform: 'translateY(5px) rotate(-1deg)' }
				},
				'legacy-glow': {
					'0%': { boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)' },
					'100%': { boxShadow: '0 0 40px rgba(234, 179, 8, 0.6)' }
				}
			}
		}
	},
	plugins: [daisyui, typography],
	daisyui: {
		themes: [
			{
				heirloom: {
					primary: '#0ea5e9',
					secondary: '#eab308',
					accent: '#8b5cf6',
					neutral: '#1f2937',
					'base-100': '#ffffff',
					'base-200': '#f3f4f6',
					'base-300': '#e5e7eb',
					info: '#06b6d4',
					success: '#10b981',
					warning: '#f59e0b',
					error: '#ef4444'
				}
			},
			'dark'
		]
	}
};