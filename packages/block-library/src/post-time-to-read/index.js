/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

/**
 * WordPress dependencies
 */
import { clock as icon } from '@wordpress/icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
};
