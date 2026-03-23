import { ResponseFormatJSONSchema } from 'openai/resources';

export const multiCardSchema: ResponseFormatJSONSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'multi_card_scan_result',
    strict: true,
    schema: {
      type: 'object',
      required: ['grid_rows', 'grid_cols', 'cards'],
      additionalProperties: false,
      properties: {
        grid_rows: {
          type: 'integer',
          description:
            'Number of rows in the card grid layout (e.g., 2 rows of cards)',
        },
        grid_cols: {
          type: 'integer',
          description:
            'Number of columns in the card grid layout (e.g., 3 columns of cards)',
        },
        cards: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'card_index',
              'grid_row',
              'grid_col',
              'bbox_x_min',
              'bbox_y_min',
              'bbox_x_max',
              'bbox_y_max',
              'player_name',
              'card_year',
              'card_set',
              'card_number',
              'sport',
              'manufacturer',
              'condition_summary',
              'raw_price_low',
              'raw_price_high',
              'psa_recommendation',
              'confidence',
            ],
            additionalProperties: false,
            properties: {
              card_index: {
                type: 'integer',
                description:
                  'Position in image, 0-indexed, left-to-right top-to-bottom',
              },
              grid_row: {
                type: 'integer',
                description:
                  'Row position of this card in the grid, 0-indexed from top',
              },
              grid_col: {
                type: 'integer',
                description:
                  'Column position of this card in the grid, 0-indexed from left',
              },
              bbox_x_min: {
                type: 'number',
                description:
                  'Left edge of this card as a fraction of total image width (0.0 = far left, 1.0 = far right). Be tight to the card border.',
              },
              bbox_y_min: {
                type: 'number',
                description:
                  'Top edge of this card as a fraction of total image height (0.0 = top, 1.0 = bottom). Be tight to the card border.',
              },
              bbox_x_max: {
                type: 'number',
                description:
                  'Right edge of this card as a fraction of total image width. Be tight to the card border.',
              },
              bbox_y_max: {
                type: 'number',
                description:
                  'Bottom edge of this card as a fraction of total image height. Be tight to the card border.',
              },
              player_name: { type: 'string' },
              card_year: {
                type: 'string',
                description: "e.g. '1989'",
              },
              card_set: {
                type: 'string',
                description: "e.g. 'Topps Traded'",
              },
              card_number: {
                type: 'string',
                description: "Card number if visible, or 'unknown'",
              },
              sport: {
                type: 'string',
                enum: [
                  'MLB',
                  'NBA',
                  'NFL',
                  'NHL',
                  'golf',
                  'pokemon',
                  'soccer',
                  'other',
                ],
              },
              manufacturer: {
                type: 'string',
                description: "e.g. 'Topps', 'Fleer', 'Upper Deck'",
              },
              condition_summary: {
                type: 'string',
                description: 'Brief condition note, 1-2 sentences',
              },
              raw_price_low: {
                type: 'number',
                description: 'Low estimate in USD',
              },
              raw_price_high: {
                type: 'number',
                description: 'High estimate in USD',
              },
              psa_recommendation: {
                type: 'string',
                enum: ['yes', 'no', 'maybe'],
              },
              confidence: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description:
                  'How confident you are in the card identification',
              },
            },
          },
        },
      },
    },
  },
};

export const singleCardSchema: ResponseFormatJSONSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'single_card_evaluation_result',
    strict: true,
    schema: {
      type: 'object',
      required: ['card'],
      additionalProperties: false,
      properties: {
        card: {
          type: 'object',
          required: [
            'player_name',
            'card_year',
            'card_set',
            'card_number',
            'sport',
            'manufacturer',
            'centering_score',
            'centering_notes',
            'corners_score',
            'corners_notes',
            'edges_score',
            'edges_notes',
            'surface_score',
            'surface_notes',
            'estimated_psa_grade_low',
            'estimated_psa_grade_high',
            'grading_explanation',
            'grade_improvement_tips',
            'raw_price_low',
            'raw_price_high',
            'graded_value_low',
            'graded_value_high',
          ],
          additionalProperties: false,
          properties: {
            player_name: { type: 'string' },
            card_year: { type: 'string' },
            card_set: { type: 'string' },
            card_number: { type: 'string' },
            sport: {
              type: 'string',
              enum: [
                'MLB',
                'NBA',
                'NFL',
                'NHL',
                'golf',
                'pokemon',
                'soccer',
                'other',
              ],
            },
            manufacturer: { type: 'string' },
            centering_score: {
              type: 'number',
              description: '1.0 to 10.0 scale',
            },
            centering_notes: {
              type: 'string',
              description:
                'Detailed centering analysis including approximate percentage',
            },
            corners_score: { type: 'number' },
            corners_notes: {
              type: 'string',
              description: 'Detailed corner analysis for all four corners',
            },
            edges_score: { type: 'number' },
            edges_notes: {
              type: 'string',
              description: 'Detailed edge analysis for all four edges',
            },
            surface_score: { type: 'number' },
            surface_notes: {
              type: 'string',
              description:
                'Detailed surface analysis including scratches, print issues, etc.',
            },
            estimated_psa_grade_low: {
              type: 'number',
              description: 'Low end of estimated PSA grade (e.g., 7)',
            },
            estimated_psa_grade_high: {
              type: 'number',
              description: 'High end of estimated PSA grade (e.g., 8)',
            },
            grading_explanation: {
              type: 'string',
              description:
                'Detailed explanation of what factors contribute most to the grade',
            },
            grade_improvement_tips: {
              type: 'string',
              description:
                'What would make this card grade higher or lower',
            },
            raw_price_low: { type: 'number' },
            raw_price_high: { type: 'number' },
            graded_value_low: {
              type: 'number',
              description:
                'Estimated value at the low end of the PSA grade range',
            },
            graded_value_high: {
              type: 'number',
              description:
                'Estimated value at the high end of the PSA grade range',
            },
          },
        },
      },
    },
  },
};
