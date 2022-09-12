/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import { _x, __, isRTL } from '@wordpress/i18n';
import {
	useAsyncList,
	useViewportMatch,
	__experimentalUseDialog as useDialog,
	useReducedMotion,
} from '@wordpress/compose';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	__unstableMotion as motion,
	FlexBlock,
	Card,
	CardBody,
	Button,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';
import PatternsExplorerModal from './block-patterns-explorer/explorer';

function usePatternsCategories() {
	const [ allPatterns, allCategories ] = usePatternsState();

	const hasRegisteredCategory = useCallback(
		( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return false;
			}

			return pattern.categories.some( ( cat ) =>
				allCategories.some( ( category ) => category.name === cat )
			);
		},
		[ allCategories ]
	);

	// Remove any empty categories.
	const populatedCategories = useMemo( () => {
		const categories = allCategories
			.filter( ( category ) =>
				allPatterns.some( ( pattern ) =>
					pattern.categories?.includes( category.name )
				)
			)
			.sort( ( { name: currentName }, { name: nextName } ) => {
				if ( ! [ currentName, nextName ].includes( 'featured' ) ) {
					return 0;
				}
				return currentName === 'featured' ? -1 : 1;
			} );

		if (
			allPatterns.some(
				( pattern ) => ! hasRegisteredCategory( pattern )
			) &&
			! categories.find(
				( category ) => category.name === 'uncategorized'
			)
		) {
			categories.push( {
				name: 'uncategorized',
				label: _x( 'Uncategorized' ),
			} );
		}

		return categories;
	}, [ allPatterns, allCategories ] );

	return populatedCategories;
}

export function BlockPatternsCategoryDialog( {
	rootClientId,
	onInsert,
	category,
	onClose,
} ) {
	const disableMotion = useReducedMotion();
	const [ ref, props ] = useDialog( {
		onClose,
	} );

	return (
		<motion.div
			ref={ ref }
			{ ...props }
			initial={ { width: disableMotion ? 300 : 0 } }
			animate={ { width: 300 } }
			className="block-editor-inserter__patterns-category-panel"
		>
			<BlockPatternsCategoryPanel
				rootClientId={ rootClientId }
				onInsert={ onInsert }
				category={ category }
			/>
		</motion.div>
	);
}

export function BlockPatternsCategoryPanel( {
	rootClientId,
	onInsert,
	category,
} ) {
	const [ allPatterns, , onClick ] = usePatternsState(
		onInsert,
		rootClientId
	);

	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) =>
				category.name === 'uncategorized'
					? ! pattern.categories?.length
					: pattern.categories?.includes( category.name )
			),
		[ allPatterns, category ]
	);

	const currentShownPatterns = useAsyncList( currentCategoryPatterns );

	if ( ! currentCategoryPatterns.length ) {
		return null;
	}

	return (
		<div>
			<h3>{ category.label }</h3>
			<p>{ category.description }</p>
			<BlockPatternList
				shownPatterns={ currentShownPatterns }
				blockPatterns={ currentCategoryPatterns }
				onClickPattern={ onClick }
				label={ category.label }
				orientation="vertical"
				isDraggable
			/>
		</div>
	);
}

function BlockPatternsTabs( {
	onSelectCategory,
	selectedCategory,
	onInsert,
	rootClientId,
} ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );
	const categories = usePatternsCategories();
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<>
			<Card isBorderless>
				<CardBody size="small">
					{ ! isMobile && (
						<>
							<ItemGroup>
								{ categories.map( ( category ) => (
									<Item
										key={ category.name }
										onClick={ () =>
											onSelectCategory( category )
										}
										className={
											category === selectedCategory
												? 'block-editor-inserter__patterns-selected-category'
												: null
										}
									>
										<HStack>
											<FlexBlock>
												{ category.label }
											</FlexBlock>
											<Icon icon={ chevronRight } />
										</HStack>
									</Item>
								) ) }
							</ItemGroup>

							<Button
								variant="link"
								onClick={ () =>
									setShowPatternsExplorer( true )
								}
								className="block-editor-inserter__patterns-explore-button"
							>
								{ __( 'Explore all patterns' ) }
							</Button>
						</>
					) }
					{ isMobile && (
						<BlockPatternsTabNavigation
							onInsert={ onInsert }
							rootClientId={ rootClientId }
						/>
					) }
				</CardBody>
			</Card>
			{ showPatternsExplorer && (
				<PatternsExplorerModal
					initialCategory={ selectedCategory }
					patternCategories={ categories }
					onModalClose={ () => setShowPatternsExplorer( false ) }
				/>
			) }
		</>
	);
}

function BlockPatternsTabNavigation( { onInsert, rootClientId } ) {
	const categories = usePatternsCategories();

	return (
		<NavigatorProvider initialPath="/">
			<NavigatorScreen path="/">
				<ItemGroup>
					{ categories.map( ( category ) => (
						<NavigatorButton
							key={ category.name }
							path={ `/category/${ category.name }` }
							as={ Item }
							isAction
						>
							<HStack>
								<FlexBlock>{ category.label }</FlexBlock>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</HStack>
						</NavigatorButton>
					) ) }
				</ItemGroup>
			</NavigatorScreen>

			{ categories.map( ( category ) => (
				<NavigatorScreen
					key={ category.name }
					path={ `/category/${ category.name }` }
				>
					<NavigatorBackButton
						icon={ isRTL() ? chevronRight : chevronLeft }
						isSmall
						aria-label={ __( 'Navigate to the categories list' ) }
					>
						{ __( 'Back' ) }
					</NavigatorBackButton>
					<BlockPatternsCategoryPanel
						category={ category }
						rootClientId={ rootClientId }
						onInsert={ onInsert }
					/>
				</NavigatorScreen>
			) ) }
		</NavigatorProvider>
	);
}

export default BlockPatternsTabs;
