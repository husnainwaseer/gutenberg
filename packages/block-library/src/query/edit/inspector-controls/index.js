/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
	TextControl,
	SelectControl,
	RangeControl,
	ToggleControl,
	Notice,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useEffect, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import OrderControl from './order-control';
import AuthorControl from './author-control';
import ParentControl from './parent-control';
import { TaxonomyControls, useTaxonomiesInfo } from './taxonomy-controls';
import StickyControl from './sticky-control';
import {
	usePostTypes,
	useIsPostTypeHierarchical,
	useAllowedControls,
	isControlAllowed,
} from '../../utils';

export default function QueryInspectorControls( {
	attributes,
	setQuery,
	setDisplayLayout,
} ) {
	const { query, displayLayout } = attributes;
	const {
		order,
		orderBy,
		author: authorIds,
		postType,
		sticky,
		inherit,
		taxQuery,
		parents,
	} = query;
	const allowedControls = useAllowedControls( attributes );
	const [ showSticky, setShowSticky ] = useState( postType === 'post' );
	const { postTypesTaxonomiesMap, postTypesSelectOptions } = usePostTypes();
	const taxonomiesInfo = useTaxonomiesInfo( postType );
	const isPostTypeHierarchical = useIsPostTypeHierarchical( postType );
	useEffect( () => {
		setShowSticky( postType === 'post' );
	}, [ postType ] );
	const onPostTypeChange = ( newValue ) => {
		const updateQuery = { postType: newValue };
		// We need to dynamically update the `taxQuery` property,
		// by removing any not supported taxonomy from the query.
		const supportedTaxonomies = postTypesTaxonomiesMap[ newValue ];
		const updatedTaxQuery = Object.entries( taxQuery || {} ).reduce(
			( accumulator, [ taxonomySlug, terms ] ) => {
				if ( supportedTaxonomies.includes( taxonomySlug ) ) {
					accumulator[ taxonomySlug ] = terms;
				}
				return accumulator;
			},
			{}
		);
		updateQuery.taxQuery = !! Object.keys( updatedTaxQuery ).length
			? updatedTaxQuery
			: undefined;

		if ( newValue !== 'post' ) {
			updateQuery.sticky = '';
		}
		// We need to reset `parents` because they are tied to each post type.
		updateQuery.parents = [];
		setQuery( updateQuery );
	};
	const [ querySearch, setQuerySearch ] = useState( query.search );
	const onChangeDebounced = useCallback(
		debounce( () => {
			if ( query.search !== querySearch ) {
				setQuery( { search: querySearch } );
			}
		}, 250 ),
		[ querySearch, query.search ]
	);
	useEffect( () => {
		onChangeDebounced();
		return onChangeDebounced.cancel;
	}, [ querySearch, onChangeDebounced ] );
	const showInheritControl = isControlAllowed( allowedControls, 'inherit' );
	const showPostTypeControl =
		! inherit && isControlAllowed( allowedControls, 'postType' );
	const showColumnsControl = displayLayout?.type === 'flex';
	const showOrderControl =
		! inherit && isControlAllowed( allowedControls, 'order' );
	const showStickyControl =
		! inherit &&
		showSticky &&
		isControlAllowed( allowedControls, 'sticky' );
	const showSettingsPanel =
		showInheritControl ||
		showPostTypeControl ||
		showColumnsControl ||
		showOrderControl ||
		showStickyControl;
	return (
		<>
			{ showSettingsPanel && (
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						{ showInheritControl && (
							<ToggleControl
								label={ __( 'Inherit query from template' ) }
								help={ __(
									'Toggle to use the global query context that is set with the current template, such as an archive or search. Disable to customize the settings independently.'
								) }
								checked={ !! inherit }
								onChange={ ( value ) =>
									setQuery( { inherit: !! value } )
								}
							/>
						) }
						{ showPostTypeControl && (
							<SelectControl
								options={ postTypesSelectOptions }
								value={ postType }
								label={ __( 'Post type' ) }
								onChange={ onPostTypeChange }
								help={ __(
									'WordPress contains different types of content and they are divided into collections called "Post types". By default there are a few different ones such as blog posts and pages, but plugins could add more.'
								) }
							/>
						) }
						{ showColumnsControl && (
							<>
								<RangeControl
									label={ __( 'Columns' ) }
									value={ displayLayout.columns }
									onChange={ ( value ) =>
										setDisplayLayout( { columns: value } )
									}
									min={ 2 }
									max={ Math.max( 6, displayLayout.columns ) }
								/>
								{ displayLayout.columns > 6 && (
									<Notice
										status="warning"
										isDismissible={ false }
									>
										{ __(
											'This column count exceeds the recommended amount and may cause visual breakage.'
										) }
									</Notice>
								) }
							</>
						) }
						{ showOrderControl && (
							<OrderControl
								{ ...{ order, orderBy } }
								onChange={ setQuery }
							/>
						) }
						{ showStickyControl && (
							<StickyControl
								value={ sticky }
								onChange={ ( value ) =>
									setQuery( { sticky: value } )
								}
							/>
						) }
					</PanelBody>
				</InspectorControls>
			) }
			{ ! inherit && (
				<InspectorControls>
					<ToolsPanel
						className="block-library-query-toolspanel__filters"
						label={ __( 'Filters' ) }
						resetAll={ () => {
							setQuery( {
								author: '',
								parents: [],
								search: '',
								taxQuery: null,
							} );
							setQuerySearch( '' );
						} }
					>
						{ !! taxonomiesInfo?.length &&
							isControlAllowed( allowedControls, 'taxQuery' ) && (
								<ToolsPanelItem
									label={ __( 'Taxonomies' ) }
									hasValue={ () =>
										Object.values( taxQuery || {} ).some(
											( terms ) => !! terms.length
										)
									}
									onDeselect={ () =>
										setQuery( { taxQuery: null } )
									}
								>
									<TaxonomyControls
										onChange={ setQuery }
										query={ query }
									/>
								</ToolsPanelItem>
							) }
						{ isControlAllowed( allowedControls, 'author' ) && (
							<ToolsPanelItem
								hasValue={ () => !! authorIds }
								label={ __( 'Authors' ) }
								onDeselect={ () => setQuery( { author: '' } ) }
							>
								<AuthorControl
									value={ authorIds }
									onChange={ setQuery }
								/>
							</ToolsPanelItem>
						) }
						{ isControlAllowed( allowedControls, 'search' ) && (
							<ToolsPanelItem
								hasValue={ () => !! querySearch }
								label={ __( 'Keyword' ) }
								onDeselect={ () => setQuerySearch( '' ) }
							>
								<TextControl
									label={ __( 'Keyword' ) }
									value={ querySearch }
									onChange={ setQuerySearch }
								/>
							</ToolsPanelItem>
						) }
						{ isPostTypeHierarchical &&
							! isControlAllowed(
								allowedControls,
								'parents'
							) && (
								<ToolsPanelItem
									hasValue={ () => !! parents?.length }
									label={ __( 'Parents' ) }
									onDeselect={ () =>
										setQuery( { parents: [] } )
									}
								>
									<ParentControl
										parents={ parents }
										postType={ postType }
										onChange={ setQuery }
									/>
								</ToolsPanelItem>
							) }
					</ToolsPanel>
				</InspectorControls>
			) }
		</>
	);
}
