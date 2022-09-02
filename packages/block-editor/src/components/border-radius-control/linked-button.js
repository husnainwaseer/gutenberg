/**
 * WordPress dependencies
 */
import { Button, Tooltip } from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function LinkedButton( { isLinked, ...props } ) {
	const label = isLinked ? __( 'Unlink radii' ) : __( 'Link radii' );

	return (
		<Tooltip text={ label }>
			<span>
				<Button
					{ ...props }
					className="component-border-radius-control__linked-button"
					isSmall
					icon={ isLinked ? link : linkOff }
					iconSize={ 24 }
					aria-label={ label }
				/>
			</span>
		</Tooltip>
	);
}
