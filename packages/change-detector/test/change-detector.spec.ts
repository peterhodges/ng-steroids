/**
 *
 * (c) 2013-2016 Wishtack
 *
 * $Id: $
 */

import '../src/change-detector.module';
import {ChangeDetector} from '../src/change-detector';

describe('ChangeDetector', function () {

    let $compile;
    let scope;

    const _watchersCount = ({scope}) => {

        let watchersCount = 0;

        watchersCount += scope.$$watchers.length;

        scope = scope.$$childHead;

        while (scope != null) {
            watchersCount += _watchersCount({scope});
            scope = scope.$$nextSibling;
        }

        return watchersCount;

    };

    beforeEach(() => {

        const module = angular.module('wishtack.steroids.testing', [
            'wishtack.steroids.changeDetector'
        ]);

        class InnerComponent {

            static config = {
                template: `
<span>{{ 'TEXT' }}</span>
`
            }

        }

        class UserComponent {

            private _changeDetector: ChangeDetector;

            constructor($scope, ChangeDetector) {
                if(this.disableChangeDetection === undefined || this.disableChangeDetection === "true") {
                    this._changeDetector = new ChangeDetector({scope: $scope, includeChildComponents: this.includeChildComponents === "true"});
                }
            }

            static config = {
                bindings: <any>{
                    user: '<wtUser',
                    disableChangeDetection: "@",
                    includeChildComponents: "@",
                },
                transclude: true,
                controller: UserComponent,
                template: `
<div class="wt-user-name">
    <span>{{ $ctrl.user.firstName }}</span>
    <span>{{ $ctrl.user.lastName }}</span>
    <ng-transclude></ng-transclude>
</div>
<wt-inner></wt-inner>
`
            }

        }

        module.component('wtUser', UserComponent.config);
        module.component('wtInner', InnerComponent.config);

    });

    beforeEach(angular.mock.module('wishtack.steroids.testing'));

    beforeEach(angular.mock.inject((_$compile_,
                                    $rootScope) => {
        $compile = _$compile_;
        scope = $rootScope.$new();
    }));

    it('should enable watchers only when the components\' inputs change', () => {

        let element;

        scope.user = {
            firstName: 'Younes',
            lastName: 'JAAIDI'
        };

        element = $compile(`<wt-user wt-user="user" disable-change="{{true}}"></wt-user>`)(scope)[0];

        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        expect(element.querySelector('.wt-user-name').innerText).toMatch(/Younes\s+JAAIDI/);

        scope.user.firstName = 'Lionel';

        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        /* `scope.user` didn't change. Thus, the view should not be updated. */
        expect(element.querySelector('.wt-user-name').innerText).toMatch(/Younes\s+JAAIDI/);

        scope.user = {
            firstName: 'Lionel',
            lastName: 'LAFFARGUE'
        };

        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        /* `scope.user` has changed. Thus, the view should be updated. */
        expect(element.querySelector('.wt-user-name').innerText).toMatch(/Lionel\s+LAFFARGUE/);

    });

    it('should not watch local changes except if markForCheck is called', () => {

        let controller;
        let element;

        scope.user = {
            firstName: 'Younes',
            lastName: 'JAAIDI'
        };

        element = $compile(`<wt-user wt-user="user"></wt-user>`)(scope)[0];

        scope.user.firstName = 'Lionel';

        controller = angular.element(element.querySelector('wt-user>*')).scope()['$ctrl'];

        controller._changeDetector.markForCheck();

        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        /* `scope.user` has changed. Thus, the view should be updated. */
        expect(element.querySelector('.wt-user-name').innerText).toMatch(/Lionel\s+JAAIDI/);

    });

    it("should recursively disable watchers for child components if includeChildComponents option is true", function() {

        let element;

        scope.user = {
            firstName: 'Younes',
            lastName: 'JAAIDI'
        };

        /* Parent component with changeDetector that has includeChildComponents option and a child component with no changeDetector. */
        element = $compile(`<wt-user wt-user="user" include-child-components="true"><wt-user wt-user="user" disable-change-detection="false"></wt-user></wt-user>`)(scope)[0];

        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        scope.user.firstName = 'Lionel';
        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        /* `scope.user` didn't change. Thus, neither of the views should not be updated. */
        var texts = element.querySelectorAll('.wt-user-name');
        expect(texts[0].innerText).toMatch(/Younes\s+JAAIDI/);
        expect(texts[1].innerText).toMatch(/Younes\s+JAAIDI/);

        scope.user = {
            firstName: 'Lionel',
            lastName: 'LAFFARGUE'
        };

        scope.$digest();

        /* There's only one watcher for the wtUser input. */
        expect(_watchersCount({scope})).toEqual(1);

        /* `scope.user` has changed. Thus, the view should be updated. */
        var texts = element.querySelectorAll('.wt-user-name');
        expect(texts[0].innerText).toMatch(/Lionel\s+LAFFARGUE/)
        expect(texts[1].innerText).toMatch(/Lionel\s+LAFFARGUE/)

    });

});
